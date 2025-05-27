import { Router, Request, Response } from 'express';
import { requireAuth } from '../clerkAuth';
import { PaymentService, PAYMENT_PLANS } from '../services/payments';

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
 * Criar sessão de checkout via Clerk
 */
router.post('/checkout', requireAuth(), async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const { userId } = req.auth;

    if (!planId || !PAYMENT_PLANS[planId]) {
      return res.status(400).json({
        error: 'Invalid plan ID'
      });
    }

    const session = await PaymentService.createCheckoutSession(userId, planId);

    res.json(session);

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

/**
 * Buscar informações da assinatura atual
 */
router.get('/subscription', requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth;

    const subscriptionInfo = await PaymentService.getSubscriptionInfo(userId);
    const currentPlan = PAYMENT_PLANS[subscriptionInfo.plan] || PAYMENT_PLANS.free;

    res.json({
      user: {
        plan: subscriptionInfo.plan,
        planStatus: subscriptionInfo.status,
        storeLimit: currentPlan.storeLimit,
        aiCreditsLeft: currentPlan.aiCredits
      },
      currentPlan,
      subscription: subscriptionInfo.subscriptionId ? {
        id: subscriptionInfo.subscriptionId,
        status: subscriptionInfo.status
      } : null
    });

  } catch (error: any) {
    console.error('Error fetching subscription info:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription info',
      details: error.message
    });
  }
});

/**
 * Webhook do Clerk para mudanças de assinatura
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (type === 'user.updated') {
      // O Clerk automaticamente atualiza os metadados do usuário
      console.log('Usuário atualizado via webhook:', data.id);
    }

    res.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({
      error: 'Webhook error',
      details: error.message
    });
  }
});

export default router;