
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { PaymentService, PAYMENT_PLANS } from '../services/payments';
import { storage } from '../storage';

const router = Router();

/**
 * Buscar planos disponíveis
 */
router.get('/plans', (req: Request, res: Response) => {
  res.json({
    plans: PAYMENT_PLANS
  });
});

/**
 * Criar sessão de checkout
 */
router.post('/checkout', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { planId, billingPeriod } = req.body;
    const userId = (req.user as any).claims.sub;

    if (!planId || !billingPeriod) {
      return res.status(400).json({
        message: 'Plan ID and billing period are required'
      });
    }

    if (!PAYMENT_PLANS[planId]) {
      return res.status(400).json({
        message: 'Invalid plan ID'
      });
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({
        message: 'Billing period must be monthly or yearly'
      });
    }

    // URLs de sucesso e cancelamento
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://cipshopee.replit.app' 
      : 'http://localhost:5000';
    
    const successUrl = `${baseUrl}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/subscription?canceled=true`;

    const session = await PaymentService.createCheckoutSession(
      userId,
      planId,
      billingPeriod,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
});

/**
 * Criar portal do cliente
 */
router.post('/customer-portal', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;

    // Buscar usuário para obter customer ID
    const user = await storage.getUserById(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({
        message: 'No active subscription found'
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://cipshopee.replit.app' 
      : 'http://localhost:5000';
    
    const returnUrl = `${baseUrl}/dashboard/subscription`;

    const session = await PaymentService.createCustomerPortal(
      user.stripeCustomerId,
      returnUrl
    );

    res.json({
      url: session.url
    });

  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({
      message: 'Failed to create customer portal session',
      error: error.message
    });
  }
});

/**
 * Buscar informações da assinatura atual
 */
router.get('/subscription', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    let subscriptionInfo = null;

    if (user.stripeSubscriptionId) {
      subscriptionInfo = await PaymentService.getSubscriptionInfo(user.stripeSubscriptionId);
    }

    const currentPlan = PAYMENT_PLANS[user.plan] || null;

    res.json({
      user: {
        plan: user.plan,
        planStatus: user.planStatus,
        planExpiresAt: user.planExpiresAt,
        storeLimit: user.storeLimit,
        aiCreditsLeft: user.aiCreditsLeft
      },
      currentPlan,
      subscription: subscriptionInfo ? {
        id: subscriptionInfo.id,
        status: subscriptionInfo.status,
        currentPeriodStart: new Date(subscriptionInfo.current_period_start * 1000),
        currentPeriodEnd: new Date(subscriptionInfo.current_period_end * 1000),
        cancelAtPeriodEnd: subscriptionInfo.cancel_at_period_end,
        canceledAt: subscriptionInfo.canceled_at ? new Date(subscriptionInfo.canceled_at * 1000) : null
      } : null
    });

  } catch (error: any) {
    console.error('Error fetching subscription info:', error);
    res.status(500).json({
      message: 'Failed to fetch subscription info',
      error: error.message
    });
  }
});

/**
 * Cancelar assinatura
 */
router.post('/cancel-subscription', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { immediately = false } = req.body;
    const userId = (req.user as any).claims.sub;

    const user = await storage.getUserById(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.status(400).json({
        message: 'No active subscription found'
      });
    }

    await PaymentService.cancelSubscription(user.stripeSubscriptionId, immediately);

    // Criar notificação
    await storage.createNotification({
      userId,
      title: 'Cancelamento de assinatura',
      message: immediately 
        ? 'Sua assinatura foi cancelada imediatamente.'
        : 'Sua assinatura será cancelada no final do período atual.',
      type: 'info',
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      message: immediately 
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the current period'
    });

  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

/**
 * Webhook do Stripe
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    // Para webhooks do Stripe, precisamos do raw body
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    await PaymentService.handleWebhook(body, signature);

    res.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({
      message: 'Webhook error',
      error: error.message
    });
  }
});

export default router;
