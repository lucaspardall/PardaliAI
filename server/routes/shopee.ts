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

    // Configuração da integração Shopee - sempre usar região 'BR' para o Brasil
    // Garantir que a URL de redirecionamento NUNCA fique indefinida
    const redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';
    
    console.log("URL de redirecionamento que será usada:", redirectUrl);
    
    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
      redirectUrl: redirectUrl, // Usar a URL definida acima
      region: 'BR'  // Configurado explicitamente para Brasil
    };

    // Validar redirectUrl
    if (!config.redirectUrl.startsWith('https://')) {
      console.warn("⚠️ AVISO: URL de redirecionamento não usa HTTPS. A Shopee pode exigir HTTPS para redirectUrl em produção.");
    }

    // Verificar se quer mostrar a página de diagnóstico ou usar redirecionamento direto 
    const showDiagnosticPage = req.query.diagnose === 'true';
    const debugMode = req.query.debug === 'true';
    
    // Importar o ShopeeAuthManager
    const { ShopeeAuthManager, getAuthorizationUrl } = await import('../shopee/auth');
    
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
      
      // Importar implementação minimalista
      const { generateMinimalAuthUrl } = await import('../shopee/minimal');
      
      // Gerar URL minimalista
      const minimalUrl = generateMinimalAuthUrl(config);
      
      // Salvar URL para inspeção
      try {
        fs.writeFileSync('shopee_auth_minimal_url.txt', 
          `Timestamp: ${Math.floor(Date.now() / 1000)}\n\n` +
          `URL Minimalista: ${minimalUrl}`
        );
        console.log("✅ URL minimalista salva em arquivo: shopee_auth_minimal_url.txt");
      } catch (err) {
        console.error("Não foi possível salvar URL em arquivo:", err);
      }
      
      // Redirecionar diretamente
      console.log(`Redirecionando para URL minimalista: ${minimalUrl.substring(0, 100)}...`);
      return res.redirect(minimalUrl);
    }
    
    // Se o parâmetro variant for fornecido, teste variantes específicas
    if (req.query.variant) {
      console.log(`🔍 TESTANDO VARIANTE: ${req.query.variant}`);
      
      // Importar implementação de variantes
      const { generateTestVariants } = await import('../shopee/minimal');
      
      // Gerar variantes de teste
      const variants = generateTestVariants(config);
      
      // Obter a variante solicitada
      const variantName = req.query.variant as string;
      const variantUrl = variants[variantName];
      
      if (!variantUrl) {
        return res.status(400).json({
          error: 'Variante não encontrada',
          availableVariants: Object.keys(variants)
        });
      }
      
      // Salvar URL para inspeção
      try {
        fs.writeFileSync(`shopee_auth_variant_${variantName}.txt`, 
          `Timestamp: ${Math.floor(Date.now() / 1000)}\n\n` +
          `Variante [${variantName}]: ${variantUrl}`
        );
        console.log(`✅ URL variante [${variantName}] salva em arquivo`);
      } catch (err) {
        console.error("Não foi possível salvar URL em arquivo:", err);
      }
      
      // Redirecionar para a variante
      console.log(`Redirecionando para variante [${variantName}]: ${variantUrl.substring(0, 100)}...`);
      return res.redirect(variantUrl);
    }
    
    // Se estiver no modo de diagnóstico, mostrar mais opções
    if (showDiagnosticPage || req.query.diagnose === 'advanced') {
      // Importar a implementação de diagnóstico para Shopee
      const { generateAuthUrls, generateDiagnosticPage } = await import('../shopee/fallback');
      // Importar também as variantes minimalistas
      const { generateTestVariants } = await import('../shopee/minimal');
      
      // Gerar URLs alternativas para diagnóstico
      const fallbackUrls = generateAuthUrls(config);
      const minimalVariants = generateTestVariants(config);
      
      // Combinar todas as URLs
      const urls = {
        ...minimalVariants,
        ...fallbackUrls
      };
      
      console.log('Modo diagnóstico: Gerando página com múltiplas opções de autorização');
      
      // Salvar as URLs em um arquivo para referência futura
      try {
        fs.writeFileSync('shopee_auth_urls_diagnostico.txt', 
          Object.entries(urls).map(([key, url]) => 
            `${key}:\n${url}\n\n`
          ).join('---\n')
        );
        console.log('✅ URLs de diagnóstico salvas em arquivo: shopee_auth_urls_diagnostico.txt');
      } catch (err) {
        console.error('Não foi possível salvar URLs em arquivo:', err);
      }
      
      // Gerar a página de diagnóstico com todas as opções para teste
      const htmlContent = generateDiagnosticPage(urls);
      
      return res.send(htmlContent);
    }
    
    // Se estiver no modo debug, mostrar detalhes antes de redirecionar
    if (debugMode) {
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
            <p>A seguir está a URL de redirecionamento gerada:</p>
            <div class="url">${authUrl}</div>
            <p>Para continuar o processo de autorização, clique no botão abaixo:</p>
            <a href="${authUrl}" class="btn">Continuar para Shopee</a>
          </body>
        </html>
      `);
    }
    
    // Modo normal: redirecionar diretamente para a URL de autorização
    console.log(`Redirecionando para autorização oficial Shopee: ${authUrl.substring(0, 100)}...`);
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

      // Criar notificação de erro
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

    // Configuração da integração Shopee
    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
      region: 'BR'  // Configurado explicitamente para Brasil
    };

    // Importar o método de obtenção de tokens
    const { getAccessToken } = await import('../shopee/auth');

    console.log('Iniciando troca de código por tokens...');

    // Obter tokens diretamente usando o método de autenticação renovado
    const tokens = await getAccessToken(config, code as string, shop_id as string);

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