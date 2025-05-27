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
   * Obter planos disponíveis
   */
  static getPlans() {
    return PAYMENT_PLANS;
  }

  /**
   * Obter informações de um plano específico
   */
  static getPlan(planId: string) {
    return PAYMENT_PLANS[planId] || PAYMENT_PLANS.free;
  }
}