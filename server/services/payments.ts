import { clerkClient } from '@clerk/clerk-sdk-node';

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  storeLimit: number;
  aiCredits: number | 'unlimited';
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    description: 'Para começar',
    features: ['1 loja', '10 créditos de IA/mês', 'Suporte básico'],
    storeLimit: 1,
    aiCredits: 10
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para pequenas lojas',
    features: ['Até 3 lojas', '100 créditos de IA/mês', 'Suporte por email'],
    storeLimit: 3,
    aiCredits: 100
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para lojas em crescimento',
    features: ['Até 10 lojas', 'Créditos ilimitados', 'Suporte prioritário', 'Análises avançadas'],
    storeLimit: 10,
    aiCredits: 'unlimited'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes operações',
    features: ['Lojas ilimitadas', 'Créditos ilimitados', 'Suporte dedicado', 'API personalizada'],
    storeLimit: 999,
    aiCredits: 'unlimited'
  }
};

export class PaymentService {
  /**
   * Criar sessão de checkout usando Clerk
   */
  static async createCheckoutSession(userId: string, planId: string) {
    try {
      // Usar o Clerk para criar checkout session
      // Você configurará os preços no dashboard do Clerk
      const user = await clerkClient.users.getUser(userId);

      // Retornar URL para portal de assinatura do Clerk
      return {
        url: `${process.env.CLERK_FRONTEND_API}/v1/payments/checkout?plan=${planId}&user=${userId}`
      };
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  /**
   * Obter informações da assinatura via Clerk
   */
  static async getSubscriptionInfo(userId: string) {
    try {
      const user = await clerkClient.users.getUser(userId);

      // Clerk gerencia as informações de assinatura automaticamente
      const publicMetadata = user.publicMetadata as any;
      const privateMetadata = user.privateMetadata as any;

      return {
        plan: publicMetadata.plan || 'free',
        status: publicMetadata.subscriptionStatus || 'inactive',
        customerId: privateMetadata.stripeCustomerId,
        subscriptionId: privateMetadata.stripeSubscriptionId
      };
    } catch (error) {
      console.error('Erro ao buscar informações da assinatura:', error);
      throw error;
    }
  }

  /**
   * Atualizar plano do usuário
   */
  static async updateUserPlan(userId: string, planId: string, subscriptionData: any) {
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          plan: planId,
          subscriptionStatus: subscriptionData.status,
          planExpiresAt: subscriptionData.current_period_end
        },
        privateMetadata: {
          stripeCustomerId: subscriptionData.customer,
          stripeSubscriptionId: subscriptionData.id
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar plano do usuário:', error);
      throw error;
    }
  }
}