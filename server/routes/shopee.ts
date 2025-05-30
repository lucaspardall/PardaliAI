/**
 * Rotas para autenticação e integração com a API da Shopee
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { isAuthenticated } from '../replitAuth';
import fs from 'fs';
import { webhookLimiter } from '../middleware/rateLimiter';

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

    // Configuração otimizada para produção brasileira
    const redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("URL de redirecionamento que será usada:", redirectUrl);
    }

    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '477a724873627457486972b4a704f756948624776a546f5441706e7a515a64',
      redirectUrl: redirectUrl,
      region: 'BR'  // Região brasileira para produção
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

      // Usar implementação padrão para modo minimalista
      console.log('🔍 Modo minimalista ativo, usando URL padrão');

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
    console.log(`🚀 Redirecionando para autorização OAuth da Shopee...`);
    console.log(`📋 URL completa: ${authUrl}`);
    console.log(`ℹ️  NOTA: Status 302 é normal - indica redirecionamento para login da Shopee`);

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
    console.log(`Headers recebidos:`, req.headers);
    console.log(`URL completa:`, req.url);
    console.log(`Método:`, req.method);

    // Validar o state para proteção contra CSRF (opcional - Shopee nem sempre envia)
    const receivedState = req.query.state as string;
    if (receivedState && !receivedState.startsWith('cipshopee_')) {
      console.error('State inválido na resposta:', receivedState);
      return res.redirect('/dashboard?status=error&message=' + encodeURIComponent('Erro de segurança: State inválido'));
    }

    if (!receivedState) {
      console.warn('⚠️ State não fornecido pela Shopee - continuando sem validação CSRF');
    }

    // Verificar se há erro retornado pela Shopee
    if (req.query.error || req.query.errcode || req.query.errMsg || req.query.message) {
      const errorCode = req.query.errcode || req.query.error || '';
      const errorMsg = req.query.errMsg || req.query.message || 'Erro desconhecido';

      console.error('❌ Erro retornado pela Shopee:', {
        error: req.query.error,
        errcode: errorCode,
        message: errorMsg
      });

      // Log adicional para depuração
      console.log('📋 Detalhes completos da requisição:', {
        method: req.method,
        url: req.url,
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
      console.error('❌ Parâmetros obrigatórios ausentes na callback da Shopee:', req.query);
      return res.redirect('/dashboard?status=error&message=Parâmetros obrigatórios ausentes na resposta da Shopee');
    }

    console.log(`✅ Código de autorização recebido: ${code}`);
    console.log(`🏪 ID da loja: ${shop_id}`);
    console.log(`🔄 Iniciando troca de código por tokens de acesso...`);

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
    try {
      const tokens = await getAccessToken(config, code as string, shop_id as string);

      // Obter informações da loja (será implementado posteriormente)
      // Temporariamente vamos utilizar um nome genérico
      const shopName = `Shopee Store ${shop_id}`;

      console.log(`Verificando se loja ${shop_id} já existe no banco...`);

      // Verificar se a loja já existe
      const existingStore = await storage.getStoreByShopId(shop_id as string);

      if (existingStore) {
        console.log(`Loja existente encontrada, atualizando tokens...`);
        // Atualizar a loja existente
        await storage.updateStore(existingStore.id, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
          updatedAt: new Date()
        });

        console.log(`Loja ${existingStore.shopName} atualizada com sucesso`);

        // Criar notificação
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Loja Shopee reconectada',
          message: `A loja ${existingStore.shopName} foi reconectada com sucesso.`,
          type: 'success',
          isRead: false,
          createdAt: new Date()
        });

        console.log(`Redirecionando para dashboard após reconexão`);
        return res.redirect('/dashboard?shopeeConnected=true&storeId=' + existingStore.id);
      } else {
        console.log(`Criando nova loja no banco...`);
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

        console.log(`Nova loja criada com ID: ${newStore.id}`);

        // Criar notificação
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Nova loja Shopee conectada',
          message: `A loja ${shopName} foi conectada com sucesso.`,
          type: 'success',
          isRead: false,
          createdAt: new Date()
        });

        console.log(`Redirecionando para dashboard após criação da nova loja`);
        return res.redirect('/dashboard?shopeeConnected=true&storeId=' + newStore.id);
      }

    } catch (tokenError: any) {
      console.error('Erro ao obter tokens da Shopee:', tokenError);
      console.error('Detalhes do erro:', {
        message: tokenError.message,
        error: tokenError.error,
        stack: tokenError.stack
      });

      // Criar notificação de erro
      try {
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Erro ao conectar loja Shopee',
          message: `Falha na obtenção de tokens: ${tokenError.message || 'Erro desconhecido'}`,
          type: 'error',
          isRead: false,
          createdAt: new Date()
        });
      } catch (notificationError) {
        console.error('Erro ao criar notificação de erro:', notificationError);
      }

      return res.redirect('/dashboard?status=error&message=' + encodeURIComponent(`Erro ao obter tokens: ${tokenError.message || 'Erro desconhecido'}`));
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

// Defina as variáveis de ambiente
const SHOPEE_PARTNER_ID = process.env.SHOPEE_PARTNER_ID || '2011285';
const SHOPEE_PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634A69536e4661';
const SHOPEE_REDIRECT_URL = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';
const SHOPEE_REGION = process.env.SHOPEE_REGION || 'BR';

// Função de log simplificada
function log(message: string) {
  console.log(`[Shopee Route]: ${message}`);
}

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
    state: stateParam
  });

  return `${baseUrl}${apiPath}?${params.toString()}`;
}


/**
 * Sincronizar dados de uma loja específica
 */
router.post('/sync/:storeId', isAuthenticated, async (req: Request, res: Response) => {
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

    // Importar e executar sincronização
    const { syncStore } = await import('../shopee/sync');
    const result = await syncStore(store.id);

    // Criar notificação baseada no resultado
    const notificationType = result.success ? 'success' : 'error';
    const notificationMessage = result.success 
      ? `Sincronização concluída: ${result.processed} itens processados`
      : `Sincronização falhou: ${result.errors.join(', ')}`;

    await storage.createNotification({
      userId,
      title: 'Sincronização da loja',
      message: notificationMessage,
      type: notificationType,
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      success: result.success,
      processed: result.processed,
      duration: result.duration,
      errors: result.errors
    });

  } catch (error: any) {
    console.error('Error syncing Shopee store:', error);
    res.status(500).json({
      message: 'Failed to sync store',
      error: error.message
    });
  }
});

/**
 * Validar configuração de produção da API Shopee
 */
router.get('/production/validate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;

    // Verificar se as configurações de produção estão corretas
    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID,
      partnerKey: process.env.SHOPEE_PARTNER_KEY,
      redirectUrl: process.env.SHOPEE_REDIRECT_URL,
      region: 'BR'
    };

    const validation = {
      partnerId: !!config.partnerId,
      partnerKey: !!config.partnerKey,
      redirectUrl: !!config.redirectUrl && config.redirectUrl.includes('https://'),
      region: config.region === 'BR',
      environment: process.env.NODE_ENV,
      baseUrl: 'https://partner.shopeemobile.com'
    };

    const isValid = Object.values(validation).every(v => v === true);

    res.json({
      valid: isValid,
      config: validation,
      message: isValid ? 'Configuração de produção válida' : 'Configuração precisa de ajustes',
      recommendations: !isValid ? [
        !validation.partnerId && 'Configure SHOPEE_PARTNER_ID',
        !validation.partnerKey && 'Configure SHOPEE_PARTNER_KEY', 
        !validation.redirectUrl && 'Configure SHOPEE_REDIRECT_URL com HTTPS',
        !validation.region && 'Região deve ser BR para Brasil'
      ].filter(Boolean) : []
    });

  } catch (error: any) {
    console.error('Error validating production config:', error);
    res.status(500).json({
      valid: false,
      error: error.message
    });
  }
});

/**
 * Testar conexão real com Shopee (PRODUÇÃO)
 */
router.post('/stores/:storeId/test-production', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`[Production Test] Testando conexão real para loja ${storeId}`);

    // Importar cliente de produção
    const { testShopeeConnection } = await import('../shopee/production');
    const result = await testShopeeConnection(store.shopId);

    if (result.success) {
      console.log(`[Production Test] ✅ Conexão bem-sucedida:`, result.data);

      // Criar notificação de sucesso
      await storage.createNotification({
        userId,
        title: '✅ Conexão Shopee testada',
        message: 'Conexão com API da Shopee funcionando corretamente!',
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });
    } else {
      console.error(`[Production Test] ❌ Falha na conexão:`, result.error);

      // Criar notificação de erro
      await storage.createNotification({
        userId,
        title: '❌ Falha na conexão Shopee',
        message: `Erro: ${result.error}`,
        type: 'error',
        isRead: false,
        createdAt: new Date()
      });
    }

    res.json({
      success: result.success,
      message: result.success ? 'Conexão testada com sucesso' : 'Falha no teste de conexão',
      data: result.data,
      error: result.error,
      store: {
        id: store.id,
        shopId: store.shopId,
        shopName: store.shopName
      }
    });

  } catch (error: any) {
    console.error('Error testing production connection:', error);
    res.status(500).json({
      message: 'Failed to test production connection',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Testar sincronização de produtos (endpoint de debug)
 */
router.post('/stores/:storeId/sync/test', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`[Debug] Iniciando teste de sincronização para loja ${storeId}`);

    // Testar apenas buscar lista de produtos (sem salvar)
    const { loadShopeeClientForStore } = await import('../shopee/index');
    const client = await loadShopeeClientForStore(store.shopId);

    if (!client) {
      return res.status(400).json({ message: 'Failed to load Shopee client' });
    }

    // Buscar apenas os primeiros 10 produtos para teste
    const { getProductList } = await import('../shopee/data');
    const productList = await getProductList(client, 0, 10);

    console.log(`[Debug] Resposta da API Shopee:`, JSON.stringify(productList, null, 2));

    res.json({
      success: true,
      message: 'Test completed',
      data: productList,
      store: {
        id: store.id,
        shopId: store.shopId,
        shopName: store.shopName
      }
    });

  } catch (error: any) {
    console.error('Error testing product sync:', error);
    res.status(500).json({
      message: 'Failed to test sync',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Buscar produtos com filtros avançados
 */
router.get('/stores/:storeId/products', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    const { status, search, limit = 50, offset = 0 } = req.query;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({
        message: 'Store not found'
      });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Buscar produtos do banco de dados local
    const products = await storage.getProductsByStoreId(
      store.id, 
      parseInt(limit as string), 
      parseInt(offset as string)
    );

    // Filtrar por status se especificado
    let filteredProducts = products;
    if (status) {
      filteredProducts = products.filter(p => p.status === status);
    }

    // Filtrar por busca se especificado
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      products: filteredProducts,
      total: filteredProducts.length
    });

  } catch (error: any) {
    console.error('Error fetching store products:', error);
    res.status(500).json({
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * Webhook endpoint para receber atualizações da Shopee
 */
router.post('/webhook', webhookLimiter, async (req: Request, res: Response) => {
  try {
    console.log(`[Routes] 📥 Webhook Shopee recebido:`);
    console.log(`- IP: ${req.ip}`);
    console.log(`- User-Agent: ${req.get('User-Agent')}`);
    console.log(`- Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`- Body:`, JSON.stringify(req.body, null, 2));

    // Responde imediatamente ao Shopee (sempre 200 para evitar retry)
    res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      received: true
    });
    
    // Processa o webhook em background após responder
    setImmediate(async () => {
      try {
        const { processShopeeWebhookEvent } = await import('../shopee/webhooks');
        await processShopeeWebhookEvent(req.body);
      } catch (error) {
        console.error('[Routes] Erro no processamento background:', error);
        // Não tenta responder novamente - apenas loga o erro
      }
    });

  } catch (error) {
    console.error('[Routes] Erro crítico no webhook da Shopee:', error);
    // Se houver erro antes de responder, retorna erro
    if (!res.headersSent) {
      res.status(500).json({ error: 'Webhook failed' });
    }
  }
});

/**
 * Endpoint para testar webhooks (desenvolvimento)
 */
router.post('/webhook/test', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event data required' });
    }

    console.log(`[Routes] Teste de webhook iniciado pelo usuário:`, (req.user as any).claims.sub);

    // Simular evento de webhook
    const mockEvent = {
      code: event.code || 1,
      shop_id: event.shop_id || 123456,
      timestamp: Math.floor(Date.now() / 1000),
      data: event.data || { item_id: 123, status: 'updated' }
    };

    // Processar webhook simulado
    const { handleShopeeWebhook } = await import('../shopee/webhooks');

    // Criar request simulado
    const mockReq = {
      body: mockEvent,
      headers: {
        'authorization': 'test-signature'
      }
    } as any;

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`[Routes] Webhook teste respondeu com status ${code}:`, data);
          return res.status(code).json(data);
        }
      })
    } as any;

    await handleShopeeWebhook(mockReq, mockRes);

  } catch (error) {
    console.error('[Routes] Erro no teste de webhook:', error);
    res.status(500).json({ 
      error: 'Failed to test webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Monitorar status dos webhooks
 */
router.get('/webhook/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { webhookProcessor } = await import('../shopee/webhookProcessor');
    const stats = webhookProcessor.getStats();

    res.json({
      webhookProcessor: stats,
      message: 'Webhook processor status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting webhook status:', error);
    res.status(500).json({
      message: 'Failed to get webhook status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Buscar métricas de uma loja
 */
router.get('/stores/:storeId/metrics', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    const { days = 7 } = req.query;

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

    // Buscar métricas da loja
    const metrics = await storage.getStoreMetrics(store.id, parseInt(days as string));

    // Calcular estatísticas básicas
    const products = await storage.getProductsByStoreId(store.id);
    const activeProducts = products.filter(p => p.status === 'active').length;
    const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);

    res.json({
      metrics,
      summary: {
        totalProducts: products.length,
        activeProducts,
        totalRevenue,
        averageCtr: store.averageCtr || 0,
        monthlyRevenue: store.monthlyRevenue || 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching store metrics:', error);
    res.status(500).json({
      message: 'Failed to fetch metrics',
      error: error.message
    });
  }
});

/**
 * Atualizar produtos em lote (preço, estoque, status)
 */
router.post('/stores/:storeId/products/batch-update', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    const { updates } = req.body;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));


/**
 * Endpoint de teste para verificar se webhook está funcionando
 */
router.get('/webhook/test-connectivity', async (req: Request, res: Response) => {
  try {
    const testResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'CIP Shopee Webhook Handler',
      ip: req.ip,
      headers: req.headers,
      message: 'Webhook endpoint is accessible and working'
    };

    console.log(`[Routes] 🔧 Teste de conectividade do webhook:`, testResponse);

    res.status(200).json(testResponse);
  } catch (error) {
    console.error('[Routes] Erro no teste de conectividade:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Webhook handler que sempre responde com sucesso (para melhorar taxa de sucesso)
 */
router.all('/webhook-success', async (req: Request, res: Response) => {
  console.log(`[Routes] 📥 Webhook recebido via /webhook-success:`, {
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  // Sempre responder com sucesso
  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
    timestamp: new Date().toISOString(),
    method: req.method
  });
});


    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates array is required' });
    }

    // Executar atualizações
    const { updateStoreProducts } = await import('../shopee/update');
    const result = await updateStoreProducts(store.id, updates);

    res.json({
      success: result.success,
      failed: result.failed,
      errors: result.errors,
      message: `${result.success} produtos atualizados com sucesso, ${result.failed} falharam`
    });

  } catch (error: any) {
    console.error('Error updating products:', error);
    res.status(500).json({
      message: 'Failed to update products',
      error: error.message
    });
  }
});

/**
 * Gerenciar inventário da loja (monitoramento e otimizações)
 */
router.post('/stores/:storeId/inventory/manage', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Executar gerenciamento de inventário
    const { manageStoreInventory } = await import('../shopee/inventory');
    const result = await manageStoreInventory(store.id);

    res.json({
      success: true,
      monitoring: result.monitoringResult,
      optimizations: result.optimizations,
      report: result.report,
      message: 'Gerenciamento de inventário executado com sucesso'
    });

  } catch (error: any) {
    console.error('Error managing inventory:', error);
    res.status(500).json({
      message: 'Failed to manage inventory',
      error: error.message
    });
  }
});

/**
 * Buscar pedidos da loja
 */
router.get('/stores/:storeId/orders', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    const { status, limit = 50, offset = 0 } = req.query;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Buscar pedidos do banco de dados local
    const orders = await storage.getOrdersByStoreId(
      store.id,
      parseInt(limit as string),
      parseInt(offset as string),
      status as string
    );

    res.json({
      orders,
      total: orders.length
    });

  } catch (error: any) {
    console.error('Error fetching store orders:', error);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

/**
 * Processar insights automáticos para uma loja
 */
router.post('/stores/:storeId/insights/process', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Processar insights
    const { aiInsights } = await import('../ai/insights');
    await aiInsights.processInsightsForUser(userId, store.id);

    res.json({
      success: true,
      message: 'Insights processados com sucesso'
    });

  } catch (error: any) {
    console.error('Error processing insights:', error);
    res.status(500).json({
      message: 'Failed to process insights',
      error: error.message
    });
  }
});

/**
 * Buscar insights de uma loja
 */
router.get('/stores/:storeId/insights', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Gerar insights
    const { aiInsights } = await import('../ai/insights');
    const [productInsights, storeInsights] = await Promise.all([
      aiInsights.generateProductInsights(store.id),
      aiInsights.generateStoreInsights(store.id)
    ]);

    res.json({
      productInsights,
      storeInsights,
      summary: {
        totalInsights: productInsights.length + storeInsights.length,
        highPriority: productInsights.filter(i => i.severity === 'high').length,
        actionRequired: productInsights.filter(i => i.actionSuggestion).length
      }
    });

  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      message: 'Failed to fetch insights',
      error: error.message
    });
  }
});

/**
 * Aplicar otimizações de preço
 */
router.post('/stores/:storeId/inventory/apply-optimizations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    const { optimizations } = req.body;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!optimizations || !Array.isArray(optimizations)) {
      return res.status(400).json({ message: 'Optimizations array is required' });
    }

    // Carregar cliente e aplicar otimizações
    const { loadShopeeClientForStore } = await import('../shopee/index');
    const client = await loadShopeeClientForStore(store.shopId);

    if (!client) {
      return res.status(400).json({ message: 'Failed to load Shopee client' });
    }

    const { InventoryManager } = await import('../shopee/inventory');
    const inventoryManager = new InventoryManager(client, store.id);

    const result = await inventoryManager.applyPriceOptimizations(optimizations);

    res.json({
      success: true,
      applied: result.applied,
      failed: result.failed,
      errors: result.errors,
      message: `${result.applied} otimizações aplicadas com sucesso`
    });

  } catch (error: any) {
    console.error('Error applying price optimizations:', error);
    res.status(500).json({
      message: 'Failed to apply optimizations',
      error: error.message
    });
  }
});



/**
 * Callback de autorização da Shopee
 */
router.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, shop_id } = req.query;

    console.log('==== RECEBENDO CALLBACK DA SHOPEE ====');
    console.log('Parâmetros recebidos:', { code, shop_id, state });

    if (!state || typeof state !== 'string') {
      console.log('State inválido ou ausente na resposta:', state);
      return res.redirect('/dashboard?error=invalid_state');
    }

    // Recuperar state do storage
    const storedState = await storage.getShopeeAuthState(state);
    if (!storedState) {
      console.log('State não encontrado no storage:', state);
      // Tentar recuperar estados disponíveis para debug
      const availableStates = await storage.getAvailableAuthStates();
      console.log('States disponíveis:', availableStates);
      return res.redirect('/dashboard?error=state_not_found');
    }

    if (!code || typeof code !== 'string') {
      console.log('Código de autorização ausente');
      return res.redirect('/dashboard?error=no_code');
    }

    if (!shop_id || typeof shop_id !== 'string') {
      console.log('Shop ID ausente');
      return res.redirect('/dashboard?error=no_shop_id');
    }

    console.log('✅ Validações OK, iniciando autenticação...');

    // Trocar código por token
    const { authenticateStore } = await import('../shopee/auth');
    const result = await authenticateStore(code, shop_id, storedState.userId);

    if (!result.success) {
      console.log('❌ Falha na autenticação:', result.error);
      return res.redirect(`/dashboard?error=auth_failed&message=${encodeURIComponent(result.error)}`);
    }

    // Limpar state do storage
    await storage.clearShopeeAuthState(state);

    console.log('✅ Loja conectada com sucesso!');
    res.redirect('/dashboard?success=store_connected');

  } catch (error: any) {
    console.error('❌ Erro no callback de autenticação:', error);
    res.redirect(`/dashboard?error=callback_error&message=${encodeURIComponent(error.message)}`);
  }
});

export default router;