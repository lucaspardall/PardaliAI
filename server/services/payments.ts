
import Stripe from 'stripe';
import { storage } from '../storage';

// Verificar se a chave do Stripe está configurada
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isStripeConfigured = stripeSecretKey && stripeSecretKey.startsWith('sk_');

if (!isStripeConfigured) {
  console.warn('⚠️ Stripe não configurado. Configure STRIPE_SECRET_KEY no arquivo .env para usar funcionalidades de pagamento.');
}

const stripe = isStripeConfigured 
  ? new Stripe(stripeSecretKey!, { apiVersion: '2024-11-20.acacia' })
  : null;

export interface PlanPrice {
  monthly: string;
  yearly: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  prices: PlanPrice;
  features: string[];
  storeLimit: number;
  aiCredits: number | 'unlimited';
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    prices: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
    },
    features: ['Até 3 lojas', '100 créditos de IA/mês', 'Suporte básico'],
    storeLimit: 3,
    aiCredits: 100
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    prices: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly'
    },
    features: ['Até 10 lojas', 'Créditos ilimitados', 'Suporte prioritário', 'Análises avançadas'],
    storeLimit: 10,
    aiCredits: 'unlimited'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    prices: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly'
    },
    features: ['Lojas ilimitadas', 'Créditos ilimitados', 'Suporte dedicado', 'API personalizada'],
    storeLimit: 999,
    aiCredits: 'unlimited'
  }
};

export class PaymentService {
  /**
   * Criar sessão de checkout para nova assinatura
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    billingPeriod: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ) {
    if (!stripe) {
      throw new Error('Stripe não configurado. Configure as chaves da API no arquivo .env');
    }

    const plan = PAYMENT_PLANS[planId];
    if (!plan) {
      throw new Error('Plano inválido');
    }

    const priceId = billingPeriod === 'yearly' ? plan.prices.yearly : plan.prices.monthly;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        planId,
        billingPeriod
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
          billingPeriod
        }
      }
    });

    return session;
  }

  /**
   * Criar portal do cliente para gerenciar assinatura
   */
  static async createCustomerPortal(customerId: string, returnUrl: string) {
    if (!stripe) {
      throw new Error('Stripe não configurado. Configure as chaves da API no arquivo .env');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  }

  /**
   * Processar webhook do Stripe
   */
  static async handleWebhook(body: string, signature: string) {
    if (!stripe) {
      throw new Error('Stripe não configurado. Configure as chaves da API no arquivo .env');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Webhook secret não configurado');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Processar checkout completado
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id;
    const planId = session.metadata?.planId;
    
    if (!userId || !planId) {
      console.error('Missing user ID or plan ID in checkout session');
      return;
    }

    const plan = PAYMENT_PLANS[planId];
    if (!plan) {
      console.error('Invalid plan ID:', planId);
      return;
    }

    // Atualizar usuário com nova assinatura
    await storage.updateUser(userId, {
      plan: planId,
      planStatus: 'active',
      planExpiresAt: null, // Assinatura ativa não tem data de expiração
      storeLimit: plan.storeLimit,
      aiCreditsLeft: typeof plan.aiCredits === 'number' ? plan.aiCredits : 999999,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string
    });

    // Criar notificação
    await storage.createNotification({
      userId,
      title: 'Assinatura ativada!',
      message: `Seu plano ${plan.name} foi ativado com sucesso.`,
      type: 'success',
      isRead: false,
      createdAt: new Date()
    });

    console.log(`Subscription activated for user ${userId} with plan ${planId}`);
  }

  /**
   * Processar pagamento bem-sucedido
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    // Buscar usuário pelo customer ID
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Renovar créditos se necessário
    const plan = PAYMENT_PLANS[user.plan];
    if (plan && typeof plan.aiCredits === 'number') {
      await storage.updateUser(user.id, {
        aiCreditsLeft: plan.aiCredits,
        planStatus: 'active'
      });
    }

    // Criar notificação
    await storage.createNotification({
      userId: user.id,
      title: 'Pagamento processado',
      message: 'Seu pagamento foi processado com sucesso.',
      type: 'success',
      isRead: false,
      createdAt: new Date()
    });

    console.log(`Payment succeeded for user ${user.id}`);
  }

  /**
   * Processar falha no pagamento
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Atualizar status do plano
    await storage.updateUser(user.id, {
      planStatus: 'past_due'
    });

    // Criar notificação
    await storage.createNotification({
      userId: user.id,
      title: 'Falha no pagamento',
      message: 'Houve um problema com seu pagamento. Por favor, atualize seu método de pagamento.',
      type: 'error',
      isRead: false,
      createdAt: new Date()
    });

    console.log(`Payment failed for user ${user.id}`);
  }

  /**
   * Processar atualização de assinatura
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Determinar novo plano baseado no price ID
    const priceId = subscription.items.data[0]?.price.id;
    let newPlanId = user.plan;

    for (const [planKey, plan] of Object.entries(PAYMENT_PLANS)) {
      if (plan.prices.monthly === priceId || plan.prices.yearly === priceId) {
        newPlanId = planKey;
        break;
      }
    }

    const plan = PAYMENT_PLANS[newPlanId];
    if (plan) {
      await storage.updateUser(user.id, {
        plan: newPlanId,
        planStatus: subscription.status === 'active' ? 'active' : subscription.status,
        storeLimit: plan.storeLimit,
        aiCreditsLeft: typeof plan.aiCredits === 'number' ? plan.aiCredits : 999999
      });

      // Criar notificação
      await storage.createNotification({
        userId: user.id,
        title: 'Plano atualizado',
        message: `Seu plano foi atualizado para ${plan.name}.`,
        type: 'info',
        isRead: false,
        createdAt: new Date()
      });
    }

    console.log(`Subscription updated for user ${user.id}`);
  }

  /**
   * Processar cancelamento de assinatura
   */
  private static async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Voltar para plano gratuito
    await storage.updateUser(user.id, {
      plan: 'free',
      planStatus: 'active',
      storeLimit: 1,
      aiCreditsLeft: 10,
      stripeSubscriptionId: null
    });

    // Criar notificação
    await storage.createNotification({
      userId: user.id,
      title: 'Assinatura cancelada',
      message: 'Sua assinatura foi cancelada. Você foi movido para o plano gratuito.',
      type: 'info',
      isRead: false,
      createdAt: new Date()
    });

    console.log(`Subscription canceled for user ${user.id}`);
  }

  /**
   * Buscar informações da assinatura
   */
  static async getSubscriptionInfo(subscriptionId: string) {
    if (!stripe) {
      console.warn('Stripe não configurado');
      return null;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Cancelar assinatura
   */
  static async cancelSubscription(subscriptionId: string, immediately = false) {
    if (!stripe) {
      throw new Error('Stripe não configurado. Configure as chaves da API no arquivo .env');
    }

    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
}
