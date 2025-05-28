
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

    // Buscar lista de produtos
    const productList = await client.get('/api/v2/product/get_item_list', {
      offset: 0,
      page_size: 50,
      item_status: ['NORMAL', 'BANNED', 'DELETED']
    });

    if (!productList.item) {
      return {
        success: true,
        count: 0,
        errors: []
      };
    }

    const store = await storage.getStoreByShopId(shopId);
    if (!store) {
      return {
        success: false,
        count: 0,
        errors: ['Store not found']
      };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    // Processar cada produto
    for (const item of productList.item) {
      try {
        // Buscar detalhes completos do produto
        const productDetails = await client.get('/api/v2/product/get_item_base_info', {
          item_id_list: [item.item_id]
        });

        if (productDetails.item_list && productDetails.item_list.length > 0) {
          const product = productDetails.item_list[0];

          // Salvar produto no banco
          await storage.upsertProduct({
            storeId: store.id,
            shopeeItemId: product.item_id.toString(),
            name: product.item_name,
            description: product.description || '',
            price: product.price_info?.[0]?.current_price || 0,
            originalPrice: product.price_info?.[0]?.original_price || 0,
            stock: product.stock_info?.[0]?.current_stock || 0,
            sku: product.item_sku || '',
            status: product.item_status.toLowerCase(),
            images: product.image?.image_url_list || [],
            category: product.category_id?.toString() || '',
            weight: product.weight || 0,
            views: 0,
            sales: 0,
            revenue: 0,
            ctr: 0,
            conversionRate: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          syncedCount++;
        }
      } catch (productError: any) {
        errors.push(`Product ${item.item_id}: ${productError.message}`);
      }
    }

    return {
      success: true,
      count: syncedCount,
      errors
    };

  } catch (error: any) {
    return {
      success: false,
      count: 0,
      errors: [error.message || 'Unknown sync error']
    };
  }
}
