
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Rota de health check para pagamentos
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'payments'
  });
});

/**
 * Rota para obter informações de planos
 */
router.get('/plans', (req: Request, res: Response) => {
  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      features: ['1 loja', '10 créditos IA/mês', 'Suporte básico']
    },
    {
      id: 'starter',
      name: 'Iniciante',
      price: 29.90,
      features: ['1 loja', '100 créditos IA/mês', 'Suporte prioritário']
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 79.90,
      features: ['3 lojas', 'Créditos IA ilimitados', 'Suporte VIP']
    }
  ];
  
  res.json(plans);
});

/**
 * Placeholder para futuras integrações de pagamento
 */
router.post('/checkout', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // TODO: Implementar integração com Stripe/outro gateway
    res.status(501).json({ 
      message: 'Payment integration not implemented yet',
      planId: req.body.planId 
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

export default router;
