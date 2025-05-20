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
    console.log("======= INICIANDO FLUXO DE AUTORIZAÇÃO SHOPEE =======");
    console.log("Usuário autenticado:", req.user);
    console.log("Ambiente:", process.env.NODE_ENV);
    console.log("Informações de configuração da API:");
    console.log("Partner ID:", process.env.SHOPEE_PARTNER_ID);
    console.log("URL de redirecionamento configurada:", process.env.SHOPEE_REDIRECT_URL);
    console.log("===================================================");

    // Criar cliente da API com configuração explícita para BR
    const shopeeClient = createClient({
      region: 'BR'
    });
    
    // Gerar URL de autorização
    const authUrl = shopeeClient.getAuthorizationUrl();
    
    // Registrar a URL gerada para debug com detalhes completos
    console.log("======= DETALHES DA URL DE AUTORIZAÇÃO =======");
    console.log("URL completa:", authUrl);
    
    // Verificar se a URL já contém parâmetro region, caso não, adicionar
    let finalAuthUrl = authUrl;
    if (!finalAuthUrl.includes('region=')) {
      finalAuthUrl = finalAuthUrl + (finalAuthUrl.includes('?') ? '&' : '?') + 'region=BR';
    }
    
    // Verificação detalhada dos parâmetros para diagnóstico
    try {
      const urlObj = new URL(authUrl);
      console.log("Protocolo:", urlObj.protocol);
      console.log("Host:", urlObj.host);
      console.log("Parâmetros da query:");
      console.log("- partner_id:", urlObj.searchParams.get('partner_id'));
      console.log("- timestamp:", urlObj.searchParams.get('timestamp'));
      console.log("- sign:", urlObj.searchParams.get('sign'));
      console.log("- redirect:", urlObj.searchParams.get('redirect'));
      console.log("- state:", urlObj.searchParams.get('state'));
      console.log("- region:", urlObj.searchParams.get('region'));
      console.log("- auth_shop:", urlObj.searchParams.get('auth_shop'));
      console.log("- auth_type:", urlObj.searchParams.get('auth_type'));
    } catch (error) {
      console.error("Erro ao analisar URL:", error);
    }
    
    console.log("Começa com https://partner.shopeemobile.com?", authUrl.startsWith("https://partner.shopeemobile.com"));
    console.log("Contém .com.br?", authUrl.includes(".com.br"));
    console.log("Contém open.shopee?", authUrl.includes("open.shopee"));
    console.log("================================================");
    
    // Se estamos em desenvolvimento, mostrar opções para o usuário
    if (process.env.NODE_ENV === 'development') {
      return res.send(`
        <html>
          <head>
            <title>Redirecionamento para Shopee</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .card { border: 1px solid #ccc; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
              .btn { display: inline-block; padding: 10px 16px; border-radius: 4px; text-decoration: none; margin: 10px 5px 10px 0; }
              .primary { background: #ff5722; color: white; }
              .secondary { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
              .instructions { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
              .steps { list-style-type: decimal; padding-left: 20px; }
              .steps li { margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>Redirecionamento para Autenticação Shopee</h1>
            <div class="card">
              <h2>Informações</h2>
              <p>A URL de autorização da Shopee foi gerada. No ambiente de produção você seria redirecionado automaticamente.</p>
              <p>Como estamos em ambiente de desenvolvimento, você tem as seguintes opções:</p>
            </div>
            
            <div class="card">
              <h2>URL de Autorização</h2>
              <pre>${finalAuthUrl}</pre>
              <a href="${finalAuthUrl}" class="btn primary">Ir para Autorização da Shopee</a>
              <a href="/dashboard" class="btn secondary">Voltar para o Dashboard</a>
            </div>
          </body>
        </html>
      `);
    }
    
    // Em produção, redirecionar diretamente
    // Usamos um HTML com meta refresh para evitar problemas de codificação da URL
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${finalAuthUrl}">
          <title>Redirecionando para Shopee</title>
        </head>
        <body>
          <p>Redirecionando para autenticação na Shopee...</p>
          <p>Se você não for redirecionado automaticamente, <a href="${finalAuthUrl}">clique aqui</a>.</p>
          <p><small>URL completa: <code>${finalAuthUrl}</code></small></p>
        </body>
      </html>
    `);
    
    // No ambiente de desenvolvimento, tentar abrir a URL diretamente também
    if (process.env.NODE_ENV === 'development') {
      try {
        import('open').then(openModule => {
          const open = openModule.default;
          console.log('🔗 Tentando abrir URL diretamente no navegador...');
          open(authUrl).then(() => {
            console.log('✅ URL aberta com sucesso no navegador padrão.');
          });
        }).catch(err => {
          console.error('❌ Erro ao abrir URL:', err);
        });
      } catch (error) {
        console.error('❌ Erro ao importar módulo open:', error);
      }
    }
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
 * Esta rota responde em /api/shopee/callback
 */
router.get('/callback', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log(`Recebendo callback da Shopee com parâmetros:`, req.query);
    const { code, shop_id } = req.query;
    
    if (!code || !shop_id) {
      console.error('Parâmetros obrigatórios ausentes na callback da Shopee:', req.query);
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
      
      res.redirect('/dashboard');
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
      
      res.redirect('/dashboard');
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
    
    res.redirect('/dashboard?status=error&message=' + encodeURIComponent(error.message || 'Unknown error'));
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