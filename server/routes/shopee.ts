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

    // Importar a implementação de diagnóstico para Shopee
    const { generateAuthUrls, generateDiagnosticPage } = await import('../shopee/fallback');

    // Verificar se está em modo direto (sem página de diagnóstico)
    const directMode = req.query.direct === 'true';
    const method = req.query.method as string || 'standard';
    const debug = req.query.debug === 'true';

    // Configuração da integração Shopee - sempre usar região 'BR' para o Brasil
    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
      region: 'BR'  // Configurado explicitamente para Brasil
    };

    // Validar redirectUrl
    if (!config.redirectUrl.startsWith('https://')) {
      console.warn("⚠️ AVISO: URL de redirecionamento não usa HTTPS. A Shopee pode exigir HTTPS para redirectUrl em produção.");
    }

    // Gerar URLs de autorização com todos os métodos disponíveis
    const urls = generateAuthUrls(config);
    
    // Salvar URLs em arquivo para inspeção e debug
    try {
      fs.writeFileSync('shopee_auth_url.txt', 
        `Timestamp: ${Math.floor(Date.now() / 1000)}\n\n` +
        `URL Padrão: ${urls.standardUrl}\n\n` +
        `URL Minimalista: ${urls.minimalUrl}\n\n` +
        `URL Regional: ${urls.alternativeUrl}\n\n` +
        `URL Login Direto: ${urls.directSellerLoginUrl}`
      );
      console.log("✅ URLs salvas em arquivo para inspeção: shopee_auth_url.txt");
    } catch (err) {
      console.error("Não foi possível salvar URLs em arquivo:", err);
    }
    
    // Registrar componentes críticos das URLs para diagnóstico
    try {
      // Extrair parâmetros importantes
      const standardUrlParams = new URL(urls.standardUrl);
      const directUrlParams = new URL(urls.directSellerLoginUrl);
      
      console.log("=== INFORMAÇÕES DE DIAGNÓSTICO DE URLS ===");
      console.log("URL Padrão - Componentes:");
      console.log("- Partner ID:", standardUrlParams.searchParams.get('partner_id'));
      console.log("- Timestamp:", standardUrlParams.searchParams.get('timestamp'));
      console.log("- Sign:", standardUrlParams.searchParams.get('sign'));
      console.log("- Redirect:", standardUrlParams.searchParams.get('redirect'));
      console.log("===========================================");
    } catch (err) {
      console.error("Erro ao analisar URLs para diagnóstico:", err);
    }
    
    // Se mode direto, redirecionar para o método solicitado
    if (directMode) {
      let redirectUrl;
      
      switch (method) {
        case 'minimal':
          redirectUrl = urls.minimalUrl;
          break;
        case 'alternative':
          redirectUrl = urls.alternativeUrl;
          break;
        case 'direct':
          redirectUrl = urls.directSellerLoginUrl;
          break;
        case 'standard':
        default:
          redirectUrl = urls.standardUrl;
          break;
      }
      
      console.log(`Redirecionando diretamente para método ${method}: ${redirectUrl.substring(0, 100)}...`);
      
      // Se estiver no modo debug, mostrar detalhes antes de redirecionar
      if (debug) {
        return res.send(`
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Debug da URL de Autorização</title>
              <style>
                body { font-family: monospace; line-height: 1.5; padding: 20px; }
                .url { word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; }
                .btn { display: inline-block; background: #ee4d2d; color: white; padding: 10px 15px; 
                       text-decoration: none; border-radius: 4px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h1>Modo Debug - Redirecionamento para Shopee</h1>
              <p>A seguir está a URL de redirecionamento gerada (método: ${method}):</p>
              <div class="url">${redirectUrl}</div>
              <p>Para continuar o processo de autorização, clique no botão abaixo:</p>
              <a href="${redirectUrl}" class="btn">Continuar para Shopee</a>
            </body>
          </html>
        `);
      }
      
      return res.redirect(redirectUrl);
    }
    
    // Gerar a página de diagnóstico com todas as opções para teste
    const htmlContent = generateDiagnosticPage(urls);
    
    return res.send(htmlContent);

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

      // Log adicional para depuração de redirecionamento
      console.log('Detalhes completos da requisição:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query
      });

      // Tratamento específico para erro de token não encontrado ou autorização
      if (errorCode === '2' || 
          (typeof errorMsg === 'string' && (
            errorMsg.includes('token not found') || 
            errorMsg.includes('status_code=302') || 
            errorMsg.includes('authentication')
          ))) {
        console.log('Detectado erro de autenticação ou redirecionamento. Verificando configuração...');

        // Log detalhado de diagnóstico
        console.log('Configuração atual:');
        console.log('- Domínio da API utilizado:', 'https://partner.shopeemobile.com');
        console.log('- URL de redirecionamento:', process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback');
        console.log('- Partner ID:', process.env.SHOPEE_PARTNER_ID || '2011285');
        
        // Tentar nova tentativa de autorização com parâmetros mais explícitos
        const partnerId = process.env.SHOPEE_PARTNER_ID || '2011285';
        const partnerKey = process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661';
        const redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';
        const timestamp = Math.floor(Date.now() / 1000);
        const path = '/api/v2/shop/auth_partner';
        const baseString = `${partnerId}${path}${timestamp}`;
        const sign = require('crypto').createHmac('sha256', partnerKey).update(baseString).digest('hex');
        
        // Construir URL corrigida com todos os parâmetros necessários
        const correctAuthUrl = `https://partner.shopeemobile.com${path}?` +
          `partner_id=${partnerId}&` +
          `timestamp=${timestamp}&` +
          `sign=${sign}&` +
          `redirect=${encodeURIComponent(redirectUrl)}&` +
          `state=cipshopee_retry_${Date.now()}&` +
          `region=BR&` +
          `is_auth_shop=true&` +
          `login_type=seller&` +
          `auth_type=direct`;
        
        console.log('Tentando nova URL de autorização corrigida:', correctAuthUrl);

        // Criar notificação de erro
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Erro na autorização - Tentando corrigir automaticamente',
          message: 'Estamos redirecionando você para uma URL de autenticação corrigida. Por favor, siga as instruções na tela.',
          type: 'warning',
          isRead: false,
          createdAt: new Date()
        });

        // Redirecionar para a URL corrigida
        return res.redirect(correctAuthUrl);
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