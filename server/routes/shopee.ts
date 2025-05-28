
import { Router, Request, Response } from 'express';
import { isAuthenticated, getAuth } from '../clerkAuth';

const router = Router();

/**
 * Rota de health check para Shopee
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'shopee'
  });
});

/**
 * Iniciar processo de autorização com Shopee
 */
router.get('/authorize', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    
    // TODO: Implementar fluxo de autorização OAuth da Shopee
    res.json({
      message: 'Shopee authorization flow not implemented yet',
      userId,
      authUrl: null
    });
  } catch (error) {
    console.error('Error starting Shopee authorization:', error);
    res.status(500).json({ message: 'Failed to start authorization' });
  }
});

/**
 * Callback de autorização da Shopee
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, shop_id } = req.query;
    
    // TODO: Implementar processamento do callback OAuth
    res.json({
      message: 'Shopee callback not implemented yet',
      code,
      shop_id
    });
  } catch (error) {
    console.error('Error processing Shopee callback:', error);
    res.status(500).json({ message: 'Failed to process callback' });
  }
});

/**
 * Sincronizar produtos da loja Shopee
 */
router.post('/sync/:storeId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { userId } = getAuth(req);
    
    // TODO: Implementar sincronização de produtos
    res.json({
      message: 'Product sync not implemented yet',
      storeId,
      userId
    });
  } catch (error) {
    console.error('Error syncing Shopee products:', error);
    res.status(500).json({ message: 'Failed to sync products' });
  }
});

export default router;
