/**
 * Rotas para autenticação e integração com a API da Shopee
 */
import { Router, Request, Response } from 'express';
import { createClient } from '../shopee';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Inicia o fluxo de autenticação OAuth com a Shopee
 */
router.get('/authorize', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Criar cliente da API
    const shopeeClient = createClient();
    
    // Gerar URL de autorização
    const authUrl = shopeeClient.getAuthorizationUrl();
    
    // Redirecionar para a URL de autorização
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Error starting Shopee OAuth flow:', error);
    res.status(500).json({
      message: 'Failed to start authorization process',
      error: error.message
    });
  }
});

/**
 * Callback para o fluxo de autorização OAuth da Shopee
 */
router.get('/callback', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { code, shop_id } = req.query;
    
    if (!code || !shop_id) {
      return res.status(400).json({
        message: 'Missing required parameters',
        error: 'Missing code or shop_id'
      });
    }
    
    // Criar cliente da API
    const shopeeClient = createClient();
    
    // Trocar o código por tokens de acesso
    const tokens = await shopeeClient.connect(code as string, shop_id as string);
    
    // Obter informações da loja (será implementado posteriormente)
    // Temporariamente vamos utilizar um nome genérico
    const shopName = `Shopee Store ${shop_id}`;
    
    // Verificar se a loja já existe
    const existingStore = await storage.getStoreByShopId(shop_id as string);
    
    if (existingStore) {
      // Atualizar a loja existente
      await storage.updateStore(existingStore.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
        updatedAt: new Date()
      });
      
      // Criar notificação
      await storage.createNotification({
        userId: (req.user as any).claims.sub,
        title: 'Loja Shopee reconectada',
        message: `A loja ${existingStore.shopName} foi reconectada com sucesso.`,
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });
      
      res.redirect('/dashboard/store/connect?status=reconnected');
    } else {
      // Criar nova loja
      const newStore = await storage.createStore({
        userId: (req.user as any).claims.sub,
        shopId: shop_id as string,
        shopName,
        shopRegion: 'BR',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalProducts: 0
      });
      
      // Criar notificação
      await storage.createNotification({
        userId: (req.user as any).claims.sub,
        title: 'Nova loja Shopee conectada',
        message: `A loja ${shopName} foi conectada com sucesso.`,
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });
      
      res.redirect('/dashboard/store/connect?status=connected');
    }
  } catch (error: any) {
    console.error('Error in Shopee OAuth callback:', error);
    
    // Criar notificação de erro
    try {
      await storage.createNotification({
        userId: (req.user as any).claims.sub,
        title: 'Erro ao conectar loja Shopee',
        message: `Ocorreu um erro ao conectar sua loja: ${error.message || 'Erro desconhecido'}`,
        type: 'error',
        isRead: false,
        createdAt: new Date()
      });
    } catch (notificationError) {
      console.error('Failed to create error notification:', notificationError);
    }
    
    res.redirect('/dashboard/store/connect?status=error&message=' + encodeURIComponent(error.message || 'Unknown error'));
  }
});

/**
 * Verifica o status de conexão com a Shopee
 */
router.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;
    
    // Obter lojas do usuário
    const stores = await storage.getStoresByUserId(userId);
    
    // Verificar se há lojas conectadas
    const connected = stores.some(store => store.isActive);
    
    res.json({
      connected,
      stores: stores.map(store => ({
        id: store.id,
        shopId: store.shopId,
        shopName: store.shopName,
        isActive: store.isActive,
        region: store.shopRegion,
        connectedAt: store.createdAt,
        totalProducts: store.totalProducts
      }))
    });
  } catch (error: any) {
    console.error('Error checking Shopee connection status:', error);
    res.status(500).json({
      message: 'Failed to check connection status',
      error: error.message
    });
  }
});

/**
 * Desconecta uma loja Shopee
 */
router.post('/disconnect/:storeId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    
    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));
    
    if (!store) {
      return res.status(404).json({
        message: 'Store not found'
      });
    }
    
    if (store.userId !== userId) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }
    
    // Marcar a loja como inativa
    await storage.updateStore(store.id, {
      isActive: false,
      updatedAt: new Date()
    });
    
    // Criar notificação
    await storage.createNotification({
      userId,
      title: 'Loja Shopee desconectada',
      message: `A loja ${store.shopName} foi desconectada.`,
      type: 'info',
      isRead: false,
      createdAt: new Date()
    });
    
    res.json({
      message: 'Store disconnected successfully'
    });
  } catch (error: any) {
    console.error('Error disconnecting Shopee store:', error);
    res.status(500).json({
      message: 'Failed to disconnect store',
      error: error.message
    });
  }
});

export default router;