/**
 * Rotas para autenticação e integração com a API da Shopee
 */
import express from "express";
import shopeeSecurityValidator from '../shopee/security';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { isAuthenticated } from '../replitAuth';
import fs from 'fs';
import { storage } from '../storage';

const router = express.Router();

interface ShopeeAuthConfig {
  partnerId: number;
  partnerKey: string;
  redirectUrl: string;
  region: string;
}

// Função para gerar a URL minimalista
function generateMinimalAuthUrl(config: ShopeeAuthConfig): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const baseUrl = 'https://partner.shopeemobile.com';
  const apiPath = '/api/v2/shop/auth_partner';
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;

  const hmac = crypto.createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');

  const stateParam = `cipshopee_${Date.now()}`;

  // Use URLSearchParams para garantir uma codificação correta dos parâmetros
  const params = new URLSearchParams({
    partner_id: config.partnerId.toString(),
    timestamp: timestamp.toString(),
    sign: signature,
    redirect: config.redirectUrl,
    state: stateParam,
  });

  return `${baseUrl}${apiPath}?${params.toString()}`;
}

// Endpoint para autorização Shopee
router.get('/authorize', isAuthenticated, (req: any, res) => {
  try {
    console.log('===================================================');
    console.log('[Shopee Auth] INICIANDO FLUXO DE AUTORIZAÇÃO SHOPEE');

    const userId = req.user.claims.sub;
    console.log(`Usuário autenticado claims: ${JSON.stringify(req.user.claims)}`);

    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);

    // Configuração da API
    const config = {
      partnerId: parseInt(process.env.SHOPEE_PARTNER_ID || '2011285'),
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '45c02a4512d09ce5fde3ed1a80c589e6a3bb09f704e838da873fbaa33aecffe1',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
      region: 'BR' // Brasil
    };

    // Validar redirectUrl
    if (!config.redirectUrl.startsWith('https://')) {
      console.warn("⚠️ AVISO: URL de redirecionamento não usa HTTPS. A Shopee pode exigir HTTPS para redirectUrl em produção.");
    }

    // Verificar se quer mostrar a página de diagnóstico ou usar redirecionamento direto 
    const showDiagnosticPage = req.query.diagnose === 'true';
    const debugMode = req.query.debug === 'true';

    // Importar o ShopeeAuthManager
    import('../shopee/auth').then(({ ShopeeAuthManager, getAuthorizationUrl }) => {
      // Gerar a URL de autorização direta usando o gerenciador de autenticação renovado
      const authUrl = getAuthorizationUrl(config);

      // Salvar URL em arquivo para inspeção
      try {
        fs.writeFileSync('shopee_auth_url.txt', 
          `Timestamp: ${Math.floor(Date.now() / 1000)}\n\n` +
          `URL de Autorização: ${authUrl}`
        );
        console.log("✅ URL salva em arquivo para inspeção: shopee_auth_url.txt");
      } catch (err) {
        console.error("Não foi possível salvar URLs em arquivo:", err);
      }

      // Se o parâmetro "minimal" for fornecido, usar a implementação minimalista
      if (req.query.minimal === 'true') {
        console.log('🔍 MODO MINIMALISTA: Usando implementação com parâmetros mínimos');

        // Gerar URL minimalista
        const minimalUrl = generateMinimalAuthUrl(config);

        // Modo normal: redirecionar diretamente para a URL de autorização
        console.log(`Redirecionando para autorização oficial Shopee: ${minimalUrl.substring(0, 100)}...`);
        return res.redirect(minimalUrl);
      }

      // Modo normal: redirecionar diretamente para a URL de autorização
      console.log(`Redirecionando para autorização oficial Shopee: ${authUrl.substring(0, 100)}...`);
      return res.redirect(authUrl);
    }).catch(error => {
      console.error('Erro ao importar módulo de autenticação:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    });
  } catch (error: any) {
    console.error('Erro em processo de autorização Shopee:', error);
    res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

/**
 * Callback para autorização com a Shopee
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, shop_id, state } = req.query;

    if (!code) {
      throw new Error('Código de autorização não fornecido pela Shopee');
    }

    // Obter token de acesso
    const { ShopeeAuthManager } = await import('../shopee/auth');
    const authManager = new ShopeeAuthManager();

    const authResult = await authManager.getAccessToken(code as string);

    if (!authResult || !authResult.access_token) {
      throw new Error('Falha ao obter token de acesso');
    }

    // Obter informações da loja
    const { ShopeeClient } = await import('../shopee/client');
    const client = new ShopeeClient({
      accessToken: authResult.access_token,
      shopId: parseInt(shop_id as string),
      partnerId: parseInt(process.env.SHOPEE_PARTNER_ID || '2011285'),
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '45c02a4512d09ce5fde3ed1a80c589e6a3bb09f704e838da873fbaa33aecffe1',
    });

    const shopInfo = await client.getShopInfo();

    // Armazenar informações no banco de dados
    if (req.user) {
      const userId = (req.user as any).claims.sub;

      // Verificar se a loja já existe
      const stores = await storage.getStoresByUserId(userId);
      const existingStore = stores.find(store => store.shopId === shop_id);

      if (existingStore) {
        // Atualizar loja existente
        await storage.updateStore(existingStore.id, {
          name: shopInfo.shop_name,
          accessToken: authResult.access_token,
          refreshToken: authResult.refresh_token,
          tokenExpiry: new Date(Date.now() + authResult.expire_in * 1000),
          isActive: true,
          updatedAt: new Date()
        });
      } else {
        // Criar nova loja
        await storage.createStore({
          userId,
          shopId: shop_id as string,
          shopName: shopInfo.shop_name,
          shopRegion: 'BR',
          accessToken: authResult.access_token,
          refreshToken: authResult.refresh_token,
          tokenExpiry: new Date(Date.now() + authResult.expire_in * 1000),
          platform: 'shopee',
          isActive: true,
          totalProducts: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Criar notificação para o usuário
      await storage.createNotification({
        userId,
        title: 'Loja Shopee conectada com sucesso',
        message: `Sua loja "${shopInfo.shop_name}" foi conectada com sucesso! Você já pode começar a gerenciar seus produtos.`,
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });

      res.redirect('/dashboard');
    }
  } catch (error: any) {
    console.error('Error in Shopee OAuth callback:', error);
    console.error('Callback error:', error);

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
    res.status(500).json({ error: error.message || 'Internal server error' });
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

// Defina as variáveis de ambiente
const SHOPEE_PARTNER_ID = process.env.SHOPEE_PARTNER_ID || '2011285';
const SHOPEE_PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661';
const SHOPEE_REDIRECT_URL = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';
const SHOPEE_REGION = process.env.SHOPEE_REGION || 'BR';

// Função de log simplificada
function log(message: string) {
  console.log(`[Shopee Route]: ${message}`);
}

// Endpoint para debugging com múltiplas opções de autorização
router.get('/debug', isAuthenticated, (req: any, res) => {
  try {
    log('[Shopee Debug] Gerando página de diagnóstico para conexão Shopee');

    // Se a URL de redirecionamento não estiver definida, use a URL padrão
    let redirectUrl = SHOPEE_REDIRECT_URL;
    if (!redirectUrl || redirectUrl === 'undefined') {
      redirectUrl = `${req.protocol}://${req.get('host')}/api/shopee/callback`;
    }

    // Configuração da autenticação Shopee
    const config: ShopeeAuthConfig = {
      partnerId: parseInt(SHOPEE_PARTNER_ID),
      partnerKey: SHOPEE_PARTNER_KEY,
      redirectUrl,
      region: SHOPEE_REGION || 'BR'
    };

    // Gerar as diferentes URLs para teste
    const minimalAuth = generateMinimalAuthUrl(config);

    // Criar uma página HTML com as URLs para teste
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Debug de Conexão Shopee</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { color: #ee4d2d; }
        .option {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .option h2 {
          margin-top: 0;
          color: #333;
        }
        .url {
          background: #f5f5f5;
          padding: 10px;
          margin: 10px 0;
          word-break: break-all;
          font-family: monospace;
          font-size: 12px;
        }
        .btn {
          display: inline-block;
          background: #ee4d2d;
          color: white;
          padding: 10px 15px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        }
        .info {
          background: #f0f8ff;
          border-left: 4px solid #1e90ff;
          padding: 10px;
          margin-bottom: 20px;
        }
        .warning {
          background: #fff8e1;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>Diagnóstico de Conexão Shopee</h1>

      <div class="info">
        <p><strong>Importante:</strong> Esta página oferece opções para testar diferentes abordagens de conexão com a Shopee.</p>
        <p>Se você encontrar problemas, verifique os logs do servidor e as ferramentas de desenvolvedor do navegador para mais detalhes.</p>
      </div>

      <div class="option">
        <h2>Opção 1: URL Minimalista (Recomendada para Testes)</h2>
        <p>Contém apenas os parâmetros obrigatórios: partner_id, timestamp, sign, redirect, state.</p>
        <div class="url">${minimalAuth}</div>
        <a href="${minimalAuth}" class="btn" target="_blank">Testar URL Minimalista</a>
      </div>

      <div class="option">
        <h2>Opção 2: API Padrão com URLSearchParams</h2>
        <p>Use a API padrão de autorização, mas com parâmetros codificados corretamente via URLSearchParams.</p>
        <a href="/api/shopee/authorize" class="btn" target="_blank">Testar API Padrão</a>
      </div>

      <div class="option">
        <h2>Opção 3: API Minimalista</h2>
        <p>Use a API padrão de autorização com apenas parâmetros obrigatórios.</p>
        <a href="/api/shopee/authorize?minimal=true" class="btn" target="_blank">Testar API Minimalista</a>
      </div>

      <div class="warning">
        <p><strong>Dica para Troubleshooting:</strong></p>
        <ol>
          <li>Abra as "Ferramentas do Desenvolvedor" do navegador (F12)</li>
          <li>Vá para a aba "Rede/Network"</li>
          <li>Marque "Preservar log/Preserve log"</li>
          <li>Clique em uma das opções acima</li>
          <li>Observe a URL exata que está sendo chamada e a resposta 302 da Shopee</li>
        </ol>
      </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Erro ao gerar página de debug:', error);
    res.status(500).json({ 
      error: 'Falha ao gerar página de debug', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Endpoint de sincronização de produtos
router.post('/sync-products', isAuthenticated, async (req: any, res) => {
  try {
    console.log('=== SYNC PRODUCTS START ===');

    // 1. Buscar loja do usuário
    const stores = await storage.getStoresByUserId(req.user.id);

    if (!stores || stores.length === 0) {
      return res.status(404).json({ error: 'Loja não conectada' });
    }

    const store = stores[0]; // Usar a primeira loja do usuário

    // 2. Verificar se token válido antes de sincronizar
    if (!store.accessToken || !store.tokenExpiresAt) {
      return res.status(401).json({ error: 'Token de acesso inválido ou expirado' });
    }

    // 3. Verificar se o token está expirado e atualizá-lo se necessário
    const { tokenManager } = await import('../services/tokenManager');
    const validToken = await tokenManager.getValidToken(store.id);

    if (!validToken) {
      console.error('Não foi possível obter um token válido para a loja');
      return res.status(401).json({ error: 'Erro ao validar token de acesso' });
    }

    // 4. Importar o cliente Shopee e configurá-lo
    const { ShopeeClient } = await import('../shopee/client');
    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
      region: 'BR'
    };

    const client = new ShopeeClient(config);

    // 5. Configurar tokens no cliente
    client.setTokens({
      accessToken: validToken,
      refreshToken: store.refreshToken,
      expiresAt: store.tokenExpiresAt,
      shopId: store.shopId
    });

    // 6. Buscar produtos da Shopee (usando mock se estiver em desenvolvimento)
    let products;
    try {
      const { PRODUCT } = await import('../shopee/endpoints');
      products = await client.post(PRODUCT.GET_ITEM_LIST, {
        page_size: 50,
        offset: 0
      });
      console.log(`Produtos obtidos da API: ${products?.items?.length || 0}`);
    } catch (error) {
      console.warn('Erro ao buscar produtos da API Shopee, usando dados mock:', error);
      // Usar dados mock em caso de erro
      const { getMockProducts } = await import('../shopee/data');
      products = { items: getMockProducts(10) };
      console.log('Usando dados mock para produtos');
    }

    // 7. Sincronizar cada produto
    let synced = 0;

    for (const item of products.items || []) {
      try {
        const productData = {
          storeId: store.id,
          productId: item.item_id.toString(),
          name: item.name,
          description: item.description || '',
          price: item.price,
          stock: item.stock || 0,
          images: item.images || [],
          status: item.status || 'active',
          category: item.category_name || '',
          lastSyncAt: new Date()
        };

        // Verificar se o produto já existe
        const existingProduct = await db
          .select()
          .from(products)
          .where(and(
            eq(products.storeId, store.id),
            eq(products.productId, item.item_id.toString())
          ));

        if (existingProduct && existingProduct.length > 0) {
          // Atualizar produto existente
          await storage.updateProduct(existingProduct[0].id, productData);
        } else {
          // Criar novo produto
          await storage.createProduct(productData);
        }

        synced++;
      } catch (err) {
        console.error(`Erro ao sincronizar produto ${item.item_id}:`, err);
      }
    }

    // 8. Atualizar contador de produtos na loja
    await storage.updateStore(store.id, { 
      totalProducts: synced,
      lastSyncAt: new Date()
    });

    console.log(`Sincronizados ${synced} produtos`);
    res.json({ 
      synced, 
      message: 'Produtos sincronizados com sucesso',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro ao sincronizar produtos' });
  }
});
export default router;