/**
 * Rotas para autenticação e integração com a API da Shopee
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { isAuthenticated } from '../replitAuth';
import fs from 'fs';

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

    // Nova implementação baseada na URL descoberta no outro SaaS com integração Shopee
    const clientId = process.env.SHOPEE_PARTNER_ID || '2011285';
    const clientSecret = process.env.SHOPEE_PARTNER_KEY || '';
    const redirectUri = 'https://cipshopee.replit.app/api/shopee/callback';
    const timestamp = Math.floor(Date.now() / 1000);
    const state = `cipshopee_${Date.now()}`;
    
    // String base para assinatura conforme formato descoberto
    const baseString = `${clientId}timestamp${timestamp}redirect_uri${redirectUri}`;
    console.log("String base para assinatura:", baseString);
    
    // Gerar assinatura HMAC-SHA256
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(baseString);
    const signature = hmac.digest('hex');
    console.log("Assinatura gerada:", signature);
    
    // Construir URL seguindo o formato do outro SaaS bem-sucedido
    const authUrl = `https://account.seller.shopee.com/signin/oauth/accountchooser?` +
                  `client_id=${clientId}&` +
                  `lang=pt-br&` +
                  `login_types=%5B1,4,2%5D&` +
                  `max_auth_age=3600&` +
                  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                  `region=SG&` + // Usar SG (Singapura) conforme identificado
                  `required_passwd=true&` +
                  `respond_code=code&` +
                  `scope=profile&` +
                  `sign=${signature}&` +
                  `timestamp=${timestamp}&` +
                  `state=${encodeURIComponent(state)}`;
    
    console.log("✅ URL de autorização da Shopee:", authUrl);

    // Salvar URL em arquivo para inspeção e debug
    try {
      fs.writeFileSync('shopee_auth_url.txt', authUrl);
      console.log("✅ URL salva em arquivo para inspeção: shopee_auth_url.txt");
    } catch (err) {
      console.error("Não foi possível salvar URL em arquivo:", err);
    }
    
    // Verificar presença de parâmetros críticos
    console.log("Verificação de parâmetros importantes:");
    console.log("- client_id:", authUrl.includes(`client_id=${clientId}`));
    console.log("- timestamp:", authUrl.includes("timestamp="));
    console.log("- sign:", authUrl.includes("sign="));
    console.log("- redirect_uri:", authUrl.includes("redirect_uri="));
    console.log("- region=SG:", authUrl.includes("region=SG"));
    
    console.log("================================================");

    // Interface amigável para testar a nova URL da Shopee baseada na pesquisa
    return res.send(`
      <html>
        <head>
          <title>Conectar Loja Shopee</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .btn { display: inline-block; padding: 10px 16px; border-radius: 4px; text-decoration: none; margin: 10px 5px 10px 0; cursor: pointer; font-weight: bold; }
            .primary { background: #ff5722; color: white; border: none; }
            .primary:hover { background: #e64a19; }
            .secondary { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
            .secondary:hover { background: #e0e0e0; }
            .info { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; }
            h1, h2 { color: #333; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
            code { font-family: monospace; font-size: 12px; }
            .logs { max-height: 200px; overflow-y: auto; }
          </style>
          <script>
            // Função para redirecionar para a Shopee usando JavaScript
            function redirectToShopee() {
              // Registrar URL para debug
              console.log("Redirecionando para URL construída via JavaScript:", "${authUrl}");
              
              // Redirecionar para a URL de autorização
              window.location.href = "${authUrl}";
              return false;
            }
          </script>
        </head>
        <body>
          <h1>Conectar Loja Shopee</h1>
          
          <div class="card info">
            <h3>⚠️ Nova abordagem de integração</h3>
            <p>Estamos usando um novo formato de URL baseado em outra integração com a Shopee.</p>
            <p>Os principais ajustes:</p>
            <ul>
              <li>Domínio: <code>account.seller.shopee.com</code></li>
              <li>Endpoint: <code>/signin/oauth/accountchooser</code></li>
              <li>Região: <code>SG</code> (Singapura)</li>
              <li>Parâmetros: <code>client_id</code> em vez de <code>partner_id</code></li>
            </ul>
          </div>
          
          <div class="card">
            <h2>URL de Autorização Gerada</h2>
            <div class="logs">
              <pre>${authUrl}</pre>
            </div>
            <button onclick="redirectToShopee()" class="btn primary">Conectar com Shopee</button>
            <a href="/dashboard" class="btn secondary">Voltar para o Dashboard</a>
          </div>
        </body>
      </html>
    `);

    // Fim da rota - o retorno é feito via interface na linha 77

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
    console.log(`==== RECEBENDO CALLBACK DA SHOPEE ====`);
    console.log(`Parâmetros recebidos:`, req.query);

    // Validar o state para proteção contra CSRF
    const receivedState = req.query.state as string;
    if (!receivedState || !receivedState.startsWith('cipshopee_')) {
      console.error('State inválido ou ausente na resposta:', receivedState);
      return res.redirect('/dashboard?status=error&message=' + encodeURIComponent('Erro de segurança: State inválido'));
    }

    // Verificar se há erro retornado pela Shopee
    if (req.query.error || req.query.errcode || req.query.errMsg || req.query.message) {
      const errorCode = req.query.errcode || req.query.error || '';
      const errorMsg = req.query.errMsg || req.query.message || 'Erro desconhecido';

      console.error('Erro retornado pela Shopee:', {
        error: req.query.error,
        errcode: errorCode,
        message: errorMsg
      });

      // Tratamento específico para erro de token não encontrado
      if (errorCode === '2' || (typeof errorMsg === 'string' && errorMsg.includes('token not found'))) {
        console.log('Detectado erro de token não encontrado. Isso geralmente ocorre quando a URL da API está incorreta. Verificando configuração...');

        // Log detalhado de diagnóstico
        console.log('Configuração atual:');
        console.log('- Domínio da API utilizado:', 'https://partner.shopeemobile.com');
        console.log('- URL de redirecionamento:', process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback');

        // Criar notificação de erro
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Erro na autorização - Token não encontrado',
          message: 'Ocorreu um erro na autenticação com a Shopee. Tente conectar sua loja novamente com as configurações corrigidas.',
          type: 'error',
          isRead: false,
          createdAt: new Date()
        });

        // Redirecionar para a página inicial com instrução para tentar novamente
        return res.redirect('/dashboard?status=error&code=token_not_found&message=' + encodeURIComponent('Token não encontrado. Por favor, tente conectar novamente com as configurações atualizadas.'));
      }

      // Criar notificação de erro para outros tipos de erro
      try {
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Erro na autorização Shopee',
          message: `A Shopee retornou um erro: ${errorMsg}`,
          type: 'error',
          isRead: false,
          createdAt: new Date()
        });
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError);
      }

      return res.redirect('/dashboard?status=error&message=' + encodeURIComponent(errorMsg));
    }

    const { code, shop_id } = req.query;

    if (!code || !shop_id) {
      console.error('Parâmetros obrigatórios ausentes na callback da Shopee:', req.query);
      return res.redirect('/dashboard?status=error&message=Parâmetros obrigatórios ausentes na resposta da Shopee');
    }

    console.log(`Código recebido: ${code}`);
    console.log(`ID da loja: ${shop_id}`);

    // Criar cliente da API
    const shopeeClient = createClient();

    // Configurar headers específicos para BR
    const headers = {
      'X-Region': 'BR',
      'X-Request-ID': crypto.randomUUID()
    };

    // Adicionar headers à requisição
    shopeeClient.setRequestHeaders(headers);

    console.log('Iniciando troca de código por tokens...');

    // Trocar o código por tokens de acesso
    const tokens = await shopeeClient.connect(code as string, shop_id as string);

    console.log('Tokens obtidos com sucesso!');

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

import { createClient } from '../shopee';
import { storage } from '../storage';
export default router;