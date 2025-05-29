/**
 * Cliente de produção para API Shopee - dados reais
 */
import { ShopeeClient } from './client';
import { ShopeeAuthConfig } from './types';
import { storage } from '../storage';

/**
 * Cria cliente Shopee configurado para produção
 */
export async function createProductionShopeeClient(shopId: string): Promise<ShopeeClient | null> {
  try {
    // Buscar loja no banco de dados
    const store = await storage.getStoreByShopId(shopId);

    if (!store || !store.isActive) {
      console.error(`[Shopee Production] Store ${shopId} not found or inactive`);
      return null;
    }

    // Verificar se tokens são válidos
    if (!store.accessToken || !store.refreshToken) {
      console.error(`[Shopee Production] Store ${shopId} missing tokens`);
      return null;
    }

    // Configuração otimizada para produção no Brasil
    const config: ShopeeAuthConfig = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4761',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
      region: 'BR'
    };

    // Validar configuração
    if (!config.partnerId || !config.partnerKey) {
      console.error('[Shopee Production] Missing partner credentials');
      return null;
    }

    // Criar tokens
    const tokens = {
      accessToken: store.accessToken,
      refreshToken: store.refreshToken,
      expiresAt: store.tokenExpiresAt || new Date(),
      shopId: store.shopId
    };

    // Criar cliente
    const client = new ShopeeClient({
      ...config,
      shopId: store.shopId,
      accessToken: store.accessToken
    });

    // Validar conexão
    const isValid = await client.validateConnection();
    if (!isValid) {
      console.error(`[Shopee Production] Connection validation failed for store ${shopId}`);
      return null;
    }

    console.log(`[Shopee Production] Client created successfully for store ${shopId}`);
    return client;

  } catch (error) {
    console.error(`[Shopee Production] Error creating client:`, error);
    return null;
  }
}

/**
 * Testa conexão real com Shopee
 */
export async function testShopeeConnection(shopId: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const client = await createProductionShopeeClient(shopId);

    if (!client) {
      return {
        success: false,
        error: 'Failed to create client'
      };
    }

    // Testar com endpoint simples
    const shopInfo = await client.get('/api/v2/shop/get_shop_info');

    return {
      success: true,
      data: shopInfo
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Sincronizar dados da loja com Shopee
 */
export async function syncShopeeStoreData(shopId: string): Promise<{
  success: boolean;
  syncedProducts?: number;
  error?: string;
}> {
  try {
    const client = await createProductionShopeeClient(shopId);

    if (!client) {
      return {
        success: false,
        error: 'Failed to create client'
      };
    }

    // Sincronizar produtos
    const products = await client.get('/api/v2/product/get_item_list', {
      page_size: 100
    });

    if (products.error) {
      return {
        success: false,
        error: products.message || 'Failed to fetch products'
      };
    }

    return {
      success: true,
      syncedProducts: products.response?.item?.length || 0
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}