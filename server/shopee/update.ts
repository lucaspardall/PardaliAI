
/**
 * Funcionalidades para atualizar dados na Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeApiResponse } from './types';

/**
 * Gerenciador de atualizações para a Shopee
 */
export class ShopeeUpdateManager {
  private client: ShopeeClient;
  private storeId: number;

  constructor(client: ShopeeClient, storeId: number) {
    this.client = client;
    this.storeId = storeId;
  }

  /**
   * Atualiza o preço de um produto
   */
  async updateProductPrice(itemId: number, price: number, modelList?: Array<{model_id: number, price: number}>): Promise<ShopeeApiResponse> {
    const params: any = {
      item_id: itemId,
      price_list: [
        {
          model_id: 0, // Produto principal
          original_price: price
        }
      ]
    };

    // Se há variações, incluir na lista de preços
    if (modelList && modelList.length > 0) {
      params.price_list.push(...modelList.map(model => ({
        model_id: model.model_id,
        original_price: model.price
      })));
    }

    return this.client.post('/api/v2/product/update_price', params);
  }

  /**
   * Atualiza o estoque de um produto
   */
  async updateProductStock(itemId: number, stock: number, modelList?: Array<{model_id: number, stock: number}>): Promise<ShopeeApiResponse> {
    const params: any = {
      item_id: itemId,
      stock_list: [
        {
          model_id: 0, // Produto principal
          normal_stock: stock
        }
      ]
    };

    // Se há variações, incluir na lista de estoque
    if (modelList && modelList.length > 0) {
      params.stock_list.push(...modelList.map(model => ({
        model_id: model.model_id,
        normal_stock: model.stock
      })));
    }

    return this.client.post('/api/v2/product/update_stock', params);
  }

  /**
   * Atualiza informações básicas de um produto
   */
  async updateProductInfo(itemId: number, updates: {
    name?: string;
    description?: string;
    weight?: number;
    dimension?: {
      package_length: number;
      package_width: number;
      package_height: number;
    };
    condition?: 'NEW' | 'USED';
    status?: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST';
  }): Promise<ShopeeApiResponse> {
    const params: any = {
      item_id: itemId
    };

    if (updates.name) params.item_name = updates.name;
    if (updates.description) params.description = updates.description;
    if (updates.weight) params.weight = updates.weight;
    if (updates.dimension) params.dimension = updates.dimension;
    if (updates.condition) params.condition = updates.condition;
    if (updates.status) params.item_status = updates.status;

    return this.client.post('/api/v2/product/update_item', params);
  }

  /**
   * Atualiza status de um pedido (confirma envio, etc)
   */
  async updateOrderStatus(orderSn: string, action: 'ship' | 'cancel', trackingNumber?: string): Promise<ShopeeApiResponse> {
    if (action === 'ship') {
      return this.client.post('/api/v2/logistics/ship_order', {
        order_sn: orderSn,
        tracking_number: trackingNumber || ''
      });
    } else if (action === 'cancel') {
      return this.client.post('/api/v2/order/cancel_order', {
        order_sn: orderSn,
        cancel_reason: 'OUT_OF_STOCK' // Pode ser customizado
      });
    }

    throw new Error('Ação não suportada');
  }

  /**
   * Atualiza informações de envio
   */
  async updateShippingInfo(orderSn: string, trackingNumber: string): Promise<ShopeeApiResponse> {
    return this.client.post('/api/v2/logistics/update_shipping_order', {
      order_sn: orderSn,
      tracking_number: trackingNumber
    });
  }

  /**
   * Atualiza múltiplos produtos em lote (preço e estoque)
   */
  async batchUpdateProducts(updates: Array<{
    itemId: number;
    price?: number;
    stock?: number;
    status?: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST';
  }>): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(`[Update] Iniciando atualização em lote de ${updates.length} produtos`);

    for (const update of updates) {
      try {
        // Atualizar preço se fornecido
        if (update.price !== undefined) {
          await this.updateProductPrice(update.itemId, update.price);
          console.log(`[Update] Preço do produto ${update.itemId} atualizado para ${update.price}`);
        }

        // Atualizar estoque se fornecido
        if (update.stock !== undefined) {
          await this.updateProductStock(update.itemId, update.stock);
          console.log(`[Update] Estoque do produto ${update.itemId} atualizado para ${update.stock}`);
        }

        // Atualizar status se fornecido
        if (update.status) {
          await this.updateProductInfo(update.itemId, { status: update.status });
          console.log(`[Update] Status do produto ${update.itemId} atualizado para ${update.status}`);
        }

        success++;

        // Delay entre atualizações para evitar rate limiting
        await this.sleep(500);

      } catch (error) {
        failed++;
        const errorMsg = `Erro ao atualizar produto ${update.itemId}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`[Update] Atualização em lote concluída: ${success} sucessos, ${failed} falhas`);

    return { success, failed, errors };
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Função utilitária para atualizar produtos de uma loja
 */
export async function updateStoreProducts(
  storeId: number, 
  updates: Array<{
    itemId: number;
    price?: number;
    stock?: number;
    status?: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST';
  }>
): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  try {
    const { storage } = await import('../storage');
    const store = await storage.getStoreById(storeId);
    
    if (!store || !store.isActive) {
      throw new Error('Loja não encontrada ou inativa');
    }

    // Carregar cliente Shopee para a loja
    const { loadShopeeClientForStore } = await import('./index');
    const client = await loadShopeeClientForStore(store.shopId);

    if (!client) {
      throw new Error('Não foi possível carregar cliente Shopee para a loja');
    }

    // Criar gerenciador de atualizações
    const updateManager = new ShopeeUpdateManager(client, storeId);

    // Executar atualizações
    return await updateManager.batchUpdateProducts(updates);

  } catch (error) {
    return {
      success: 0,
      failed: updates.length,
      errors: [error.message]
    };
  }
}
