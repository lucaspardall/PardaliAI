
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { createClient, loadClientForStore } from '../shopee';
import { syncStore } from '../shopee/sync';

const router = Router();

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'shopee'
  });
});

/**
 * Iniciar autorização Shopee
 */
router.get('/authorize', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    const client = createClient();
    const authUrl = client.getAuthorizationUrl();
    
    res.json({
      message: 'Authorization URL generated',
      userId,
      authUrl
    });
  } catch (error) {
    console.error('Error starting Shopee authorization:', error);
    res.status(500).json({ message: 'Failed to start authorization' });
  }
});

/**
 * Callback de autorização
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, shop_id } = req.query;
    
    if (!code || !shop_id) {
      return res.status(400).json({ 
        message: 'Missing required parameters: code and shop_id' 
      });
    }

    const client = createClient();
    const tokens = await client.connect(code as string, shop_id as string);
    
    res.json({
      message: 'Authorization successful',
      shopId: tokens.shopId,
      expiresAt: tokens.expiresAt
    });
  } catch (error) {
    console.error('Error processing Shopee callback:', error);
    res.status(500).json({ message: 'Failed to process callback' });
  }
});

/**
 * Sincronizar loja
 */
router.post('/sync/:storeId', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = req.user?.claims?.sub;
    
    const result = await syncStore(storeId);
    
    res.json({
      message: 'Sync completed',
      storeId,
      userId,
      result
    });
  } catch (error) {
    console.error('Error syncing Shopee store:', error);
    res.status(500).json({ message: 'Failed to sync store' });
  }
});

/**
 * Status da conexão
 */
router.get('/status/:storeId', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { storeId } = req.params;
    const client = await loadClientForStore(storeId);
    
    if (!client) {
      return res.json({ connected: false, message: 'Store not found or not connected' });
    }
    
    const status = client.getConnectionStatus();
    const isValid = await client.validateConnection();
    
    res.json({
      ...status,
      validated: isValid
    });
  } catch (error) {
    console.error('Error checking Shopee status:', error);
    res.status(500).json({ message: 'Failed to check status' });
  }
});

export default router;
