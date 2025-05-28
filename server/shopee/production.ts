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

    // Configuração para produção
    const config: ShopeeAuthConfig = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || '',
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
    const client = new ShopeeClient(config, tokens);

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
 * Sincroniza produtos reais da Shopee
 */
export async function syncRealProducts(shopId: string): Promise<{
  success: boolean;
  count: number;
  errors: string[];
}> {
  try {
    const client = await createProductionShopeeClient(shopId);

    if (!client) {
      return {
        success: false,
        count: 0,
        errors: ['Failed to create Shopee client']
      };
    }

    const products = await client.get('/api/v2/product/get_item_list', {
      page_size: 100
    });

    return {
      success: true,
      count: products?.item?.length || 0,
      errors: []
    };

  } catch (error: any) {
    return {
      success: false,
      count: 0,
      errors: [error.message || 'Sync failed']
    };
  }
}