
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

    // Gerar timestamp e parâmetros necessários
    const timestamp = Math.floor(Date.now() / 1000);
    const partnerId = process.env.SHOPEE_PARTNER_ID || '2011285';
    const partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
    const redirectUrl = 'https://cipshopee.replit.app/api/shopee/callback';
    const state = `cipshopee_${Date.now()}`;

    // Criar a string base para assinatura conforme documentação Shopee
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${partnerId}${path}${timestamp}`;

    console.log('String base para assinatura:', baseString);

    // Gerar a assinatura HMAC-SHA256
    const hmac = crypto.createHmac('sha256', partnerKey);
    hmac.update(baseString);
    const sign = hmac.digest('hex');

    // IMPORTANTE: Usar o domínio de seller para direcionar ao login do vendedor
    // Usar seller.shopee.com.br em vez de partner.shopeemobile.com
    const baseUrl = 'https://seller.shopee.com.br';
    
    // Criar parâmetros usando URLSearchParams para garantir formatação correta
    const params = new URLSearchParams();
    params.append('partner_id', partnerId);
    params.append('timestamp', timestamp.toString()); // Conversão explícita para string
    params.append('sign', sign);
    params.append('redirect', redirectUrl);
    params.append('state', state);
    params.append('region', 'BR');
    params.append('is_auth_shop', 'true');
    params.append('login_type', 'seller');
    params.append('auth_type', 'direct');
    params.append('shop_id', '');
    
    // Construir a URL usando toString do URLSearchParams
    const authUrl = `${baseUrl}${path}?${params.toString()}`;
    
    // Verificar se há o problema do ×tamp na URL
    if (authUrl.includes('×tamp=') || authUrl.includes('xtamp=')) {
      console.error("ERRO CRÍTICO: Caractere inválido no parâmetro timestamp!");
      // Reconstruir manualmente como último recurso
      const manualUrl = `${baseUrl}${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUrl)}&state=${encodeURIComponent(state)}&region=BR&is_auth_shop=true&login_type=seller&auth_type=direct&shop_id=`;
      console.log("URL reconstruída manualmente:", manualUrl);
      return res.redirect(manualUrl);
    }
    
    // Log da URL apenas para verificação
    console.log("URL final construída manualmente:", authUrl);
    
    // Verificar se a URL contém o parâmetro timestamp formatado corretamente
    if (!authUrl.includes('timestamp=')) {
      console.error("ERRO: Parâmetro timestamp não encontrado na URL!");
      console.log("URL problemática:", authUrl);
    }

    // Verificação e log da URL final
    console.log("URL final para autorização:", authUrl);

    // Verificar parâmetros críticos
    console.log("Verificação de parâmetros críticos:");
    console.log("- region=BR:", authUrl.includes("region=BR"));
    console.log("- login_type=seller:", authUrl.includes("login_type=seller"));
    console.log("- auth_type=direct:", authUrl.includes("auth_type=direct"));
    console.log("- is_auth_shop=true:", authUrl.includes("is_auth_shop=true"));

    // Salvar URL em arquivo para inspeção quando necessário
    try {
      fs.writeFileSync('shopee_auth_url.txt', authUrl);
      console.log("✅ URL salva em arquivo para inspeção: shopee_auth_url.txt");
    } catch (err) {
      console.error("Não foi possível salvar URL em arquivo:", err);
    }

    // Verificação do parâmetro auth_type
    if (!authUrl.includes('auth_type=direct')) {
      console.error("⚠️ ALERTA CRÍTICO: O parâmetro auth_type=direct não está presente na URL!");
    } else {
      console.log("✅ Parâmetro auth_type=direct presente na URL");
    }

    console.log("================================================");

    // Em desenvolvimento, mostrar opções para o usuário
    if (process.env.NODE_ENV === 'development') {
      // Extrair os componentes da URL para construir o formulário
      const timestamp = Math.floor(Date.now() / 1000);
      
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
              .important { color: #ff0000; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Redirecionamento para Autenticação Shopee</h1>
            <div class="card">
              <h2>URL de Autorização</h2>
              <pre>${authUrl}</pre>
              
              <div class="instructions">
                <p class="important">Detecção de problema com o parâmetro "timestamp"!</p>
                <p>Use o botão abaixo que utiliza JavaScript para garantir a URL correta:</p>
              </div>
              
              <button id="redirectBtn" class="btn primary">Ir para Autorização da Shopee</button>
              <a href="/dashboard" class="btn secondary">Voltar para o Dashboard</a>
              
              <script>
                // Construir a URL via JavaScript para evitar problemas de codificação
                document.getElementById('redirectBtn').addEventListener('click', function() {
                  const url = new URL('https://partner.shopeemobile.com/api/v2/shop/auth_partner');
                  url.searchParams.append('partner_id', '${partnerId}');
                  url.searchParams.append('timestamp', '${timestamp}');
                  url.searchParams.append('sign', '${sign}');
                  url.searchParams.append('redirect', 'https://cipshopee.replit.app/api/shopee/callback');
                  url.searchParams.append('state', 'cipshopee_${Date.now()}');
                  url.searchParams.append('region', 'BR');
                  url.searchParams.append('is_auth_shop', 'true');
                  url.searchParams.append('login_type', 'seller');
                  url.searchParams.append('auth_type', 'direct');
                  url.searchParams.append('shop_id', '');
                  
                  console.log('Redirecionando para URL construída via JavaScript:', url.toString());
                  window.location.href = url.toString();
                });
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Em produção, fazer uma verificação para garantir que a URL está correta
    if (authUrl.includes('×tamp=')) {
      // Corrigir a URL se estiver corrompida
      const fixedUrl = authUrl.replace('×tamp=', 'timestamp=');
      console.log('URL corrigida antes do redirecionamento:', fixedUrl);
      return res.redirect(fixedUrl);
    }
    
    return res.redirect(authUrl);

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

    // Configurar headers específicos para BR
    const headers = {
      'X-Region': 'BR',
      'X-Request-ID': crypto.randomUUID()
    };

    // Adicionar headers à requisição
    shopeeClient.setRequestHeaders(headers);

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

import { createClient } from '../shopee';
import { storage } from '../storage';
export default router;
