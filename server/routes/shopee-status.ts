
/**
 * Endpoint para verificar status completo da integração Shopee
 */
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';

const router = Router();

/**
 * Verificar se o dashboard está pronto para produção
 */
router.get('/production-status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;

    // 1. Verificar configuração das credenciais
    const hasCredentials = !!(
      process.env.SHOPEE_PARTNER_ID && 
      process.env.SHOPEE_PARTNER_KEY && 
      process.env.SHOPEE_REDIRECT_URL
    );

    // 2. Verificar lojas conectadas
    const stores = await storage.getStoresByUserId(userId);
    const activeStores = stores.filter(store => store.isActive);

    // 3. Verificar se há tokens válidos
    const storesWithValidTokens = activeStores.filter(store => 
      store.accessToken && 
      store.tokenExpiresAt && 
      new Date(store.tokenExpiresAt) > new Date()
    );

    // 4. Testar conexão real com API (se houver lojas)
    let apiConnectionStatus = null;
    if (storesWithValidTokens.length > 0) {
      try {
        const { testShopeeConnection } = await import('../shopee/production');
        const testResult = await testShopeeConnection(storesWithValidTokens[0].shopId);
        apiConnectionStatus = testResult;
      } catch (error) {
        apiConnectionStatus = {
          success: false,
          error: 'Erro ao testar conexão'
        };
      }
    }

    // 5. Verificar webhook
    const webhookUrl = `${process.env.SHOPEE_REDIRECT_URL?.replace('/api/shopee/callback', '')}/api/shopee/webhook`;
    const webhookConfigured = !!(process.env.SHOPEE_REDIRECT_URL);

    // 6. Status geral
    const readyForProduction = hasCredentials && 
                              storesWithValidTokens.length > 0 && 
                              apiConnectionStatus?.success;

    const status = {
      readyForProduction,
      checks: {
        credentials: {
          configured: hasCredentials,
          partnerId: !!process.env.SHOPEE_PARTNER_ID,
          partnerKey: !!process.env.SHOPEE_PARTNER_KEY,
          redirectUrl: !!process.env.SHOPEE_REDIRECT_URL
        },
        stores: {
          total: stores.length,
          active: activeStores.length,
          withValidTokens: storesWithValidTokens.length,
          list: activeStores.map(store => ({
            id: store.id,
            shopName: store.shopName,
            shopId: store.shopId,
            hasToken: !!store.accessToken,
            tokenValid: store.tokenExpiresAt ? new Date(store.tokenExpiresAt) > new Date() : false,
            lastSync: store.lastSyncAt
          }))
        },
        apiConnection: apiConnectionStatus,
        webhook: {
          configured: webhookConfigured,
          url: webhookUrl
        }
      },
      recommendations: []
    };

    // Gerar recomendações
    if (!hasCredentials) {
      status.recommendations.push('Configure as credenciais da Shopee (SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_REDIRECT_URL)');
    }

    if (activeStores.length === 0) {
      status.recommendations.push('Conecte pelo menos uma loja Shopee');
    }

    if (storesWithValidTokens.length === 0 && activeStores.length > 0) {
      status.recommendations.push('Renove os tokens de acesso das lojas conectadas');
    }

    if (!apiConnectionStatus?.success && storesWithValidTokens.length > 0) {
      status.recommendations.push('Verifique a conectividade com a API da Shopee');
    }

    res.json(status);

  } catch (error: any) {
    console.error('Erro ao verificar status de produção:', error);
    res.status(500).json({
      readyForProduction: false,
      error: error.message
    });
  }
});

/**
 * Realizar teste completo de integração
 */
router.post('/integration-test', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;
    const stores = await storage.getStoresByUserId(userId);
    const activeStore = stores.find(store => store.isActive);

    if (!activeStore) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma loja ativa encontrada'
      });
    }

    console.log(`[Integration Test] Testando loja ${activeStore.shopName}`);

    // Teste 1: Conexão básica
    const { testShopeeConnection } = await import('../shopee/production');
    const connectionTest = await testShopeeConnection(activeStore.shopId);

    if (!connectionTest.success) {
      return res.json({
        success: false,
        step: 'connection',
        error: connectionTest.error,
        details: 'Falha na conexão básica com API'
      });
    }

    // Teste 2: Buscar produtos
    const { loadShopeeClientForStore } = await import('../shopee/index');
    const client = await loadShopeeClientForStore(activeStore.shopId);

    if (!client) {
      return res.json({
        success: false,
        step: 'client',
        error: 'Não foi possível criar cliente Shopee'
      });
    }

    const { getProductList } = await import('../shopee/data');
    const products = await getProductList(client, 0, 5);

    // Teste 3: Sincronização de exemplo
    let syncResult = null;
    try {
      const { syncStore } = await import('../shopee/sync');
      syncResult = await syncStore(activeStore.id);
    } catch (syncError: any) {
      console.warn('Erro na sincronização de teste:', syncError.message);
    }

    res.json({
      success: true,
      tests: {
        connection: connectionTest,
        productFetch: {
          success: !!products,
          count: products?.response?.item?.length || products?.item?.length || 0
        },
        sync: syncResult
      },
      message: 'Teste de integração completado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro no teste de integração:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      step: 'unknown'
    });
  }
});

export default router;
