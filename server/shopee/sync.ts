
/**
 * Sistema de sincronização para dados da Shopee
 */
import { ShopeeClient } from './client';
import { storage } from '../storage';
import { getProductList, getProductDetails, getShopInfo, getOrderList } from './data';
import { ShopeeCache } from './cache';

interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  delayBetweenBatches?: number;
}

interface SyncResult {
  success: boolean;
  processed: number;
  errors: string[];
  duration: number;
}

/**
 * Gerenciador de sincronização para dados da Shopee
 */
export class ShopeeSyncManager {
  private client: ShopeeClient;
  private storeId: number;
  private options: Required<SyncOptions>;

  constructor(client: ShopeeClient, storeId: number, options: SyncOptions = {}) {
    this.client = client;
    this.storeId = storeId;
    this.options = {
      batchSize: options.batchSize || 50,
      maxRetries: options.maxRetries || 3,
      delayBetweenBatches: options.delayBetweenBatches || 1000,
    };
  }

  /**
   * Sincroniza todos os dados da loja
   */
  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;

    try {
      console.log(`[Sync] Iniciando sincronização completa para loja ${this.storeId}`);

      // 1. Sincronizar informações da loja
      try {
        await this.syncShopInfo();
        processed++;
        console.log(`[Sync] Informações da loja sincronizadas`);
      } catch (error) {
        errors.push(`Erro ao sincronizar informações da loja: ${error.message}`);
      }

      // 2. Sincronizar produtos
      try {
        const productResult = await this.syncProducts();
        processed += productResult.processed;
        errors.push(...productResult.errors);
        console.log(`[Sync] ${productResult.processed} produtos sincronizados`);
      } catch (error) {
        errors.push(`Erro geral na sincronização de produtos: ${error.message}`);
      }

      // 3. Sincronizar pedidos dos últimos 7 dias
      try {
        const orderResult = await this.syncRecentOrders();
        processed += orderResult.processed;
        errors.push(...orderResult.errors);
        console.log(`[Sync] ${orderResult.processed} pedidos sincronizados`);
      } catch (error) {
        errors.push(`Erro na sincronização de pedidos: ${error.message}`);
      }

      // 4. Atualizar timestamp de última sincronização
      await storage.updateStore(this.storeId, {
        lastSyncAt: new Date()
      });

      const duration = Date.now() - startTime;
      
      return {
        success: errors.length === 0,
        processed,
        errors,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        processed,
        errors: [...errors, `Erro crítico: ${error.message}`],
        duration
      };
    }
  }

  /**
   * Sincroniza informações básicas da loja
   */
  private async syncShopInfo(): Promise<void> {
    const shopInfo = await getShopInfo(this.client);
    
    if (shopInfo) {
      await storage.updateStore(this.storeId, {
        shopName: shopInfo.shop_name || `Loja ${shopInfo.shop_id}`,
        shopLogo: shopInfo.logo,
        updatedAt: new Date()
      });
    }
  }

  /**
   * Sincroniza produtos da loja
   */
  async syncProducts(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let offset = 0;
    let hasMore = true;

    try {
      console.log(`[Sync] Iniciando sincronização de produtos para loja ${this.storeId}`);

      while (hasMore) {
        console.log(`[Sync] Buscando produtos (offset: ${offset}, batch: ${this.options.batchSize})`);

        // Buscar lista de produtos com retry
        const productList = await this.withRetry(async () => {
          const result = await getProductList(this.client, offset, this.options.batchSize);
          console.log(`[Sync] API retornou:`, result);
          return result;
        });

        // Verificar estrutura da resposta da API Shopee
        const items = productList?.response?.item || productList?.item || [];
        
        if (!items || items.length === 0) {
          console.log(`[Sync] Nenhum produto encontrado no offset ${offset}`);
          hasMore = false;
          break;
        }

        console.log(`[Sync] Encontrados ${items.length} produtos`);

        // Processar produtos em lotes menores para detalhes
        const itemIds = items.map((item: any) => item.item_id).filter(id => id);
        
        if (itemIds.length === 0) {
          console.warn(`[Sync] Nenhum item_id válido encontrado nos produtos`);
          offset += this.options.batchSize;
          continue;
        }

        const detailBatchSize = Math.min(20, itemIds.length); // Shopee limita detalhes em lotes menores

        for (let i = 0; i < itemIds.length; i += detailBatchSize) {
          const batchIds = itemIds.slice(i, i + detailBatchSize);
          
          try {
            console.log(`[Sync] Buscando detalhes para ${batchIds.length} produtos`);
            
            // Buscar detalhes dos produtos
            const productDetails = await this.withRetry(async () => {
              const result = await getProductDetails(this.client, batchIds);
              console.log(`[Sync] Detalhes recebidos:`, result);
              return result;
            });

            // Processar detalhes dos produtos
            const itemList = productDetails?.response?.item_list || productDetails?.item_list || [];
            
            if (itemList.length > 0) {
              // Salvar produtos no banco
              for (const product of itemList) {
                try {
                  await this.saveProduct(product);
                  processed++;
                  console.log(`[Sync] Produto ${product.item_id} salvo com sucesso`);
                } catch (error) {
                  const errorMsg = `Erro ao salvar produto ${product.item_id}: ${error.message}`;
                  console.error(errorMsg);
                  errors.push(errorMsg);
                }
              }
            } else {
              console.warn(`[Sync] Nenhum detalhe de produto retornado para lote ${batchIds.join(',')}`);
            }

            // Delay entre lotes para evitar rate limiting
            if (i + detailBatchSize < itemIds.length) {
              await this.sleep(this.options.delayBetweenBatches);
            }

          } catch (error) {
            const errorMsg = `Erro ao buscar detalhes do lote ${i}-${i + detailBatchSize}: ${error.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Verificar se há mais páginas
        hasMore = productList?.response?.has_next_page || productList?.has_next_page || false;
        offset += this.options.batchSize;

        // Delay entre páginas
        await this.sleep(this.options.delayBetweenBatches);
      }

      console.log(`[Sync] Sincronização de produtos concluída: ${processed} produtos processados`);

      // Atualizar total de produtos na loja
      await storage.updateStore(this.storeId, {
        totalProducts: processed,
        lastSyncAt: new Date()
      });

    } catch (error) {
      const errorMsg = `Erro geral na sincronização: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    const duration = Date.now() - startTime;
    return { success: errors.length === 0, processed, errors, duration };
  }

  /**
   * Sincroniza pedidos recentes (últimos 7 dias)
   */
  private async syncRecentOrders(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;

    try {
      console.log(`[Sync] Iniciando sincronização de pedidos para loja ${this.storeId}`);
      
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60);

      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const orderList = await this.withRetry(async () => {
          return await getOrderList(
            this.client,
            'create_time',
            sevenDaysAgo,
            now,
            this.options.batchSize,
            cursor
          );
        });

        if (!orderList?.response?.order_list || orderList.response.order_list.length === 0) {
          hasMore = false;
          break;
        }

        const orders = orderList.response.order_list;
        console.log(`[Sync] Encontrados ${orders.length} pedidos`);

        // Buscar detalhes dos pedidos em lotes menores
        const detailBatchSize = Math.min(20, orders.length);
        
        for (let i = 0; i < orders.length; i += detailBatchSize) {
          const batchOrderSns = orders.slice(i, i + detailBatchSize).map((order: any) => order.order_sn);
          
          try {
            const { getOrderDetails } = await import('./data');
            const orderDetails = await this.withRetry(async () => {
              return await getOrderDetails(this.client, batchOrderSns);
            });

            const detailsList = orderDetails?.response?.order_list || [];
            
            for (const orderDetail of detailsList) {
              try {
                await this.saveOrder(orderDetail);
                processed++;
                console.log(`[Sync] Pedido ${orderDetail.order_sn} salvo com sucesso`);
              } catch (error) {
                const errorMsg = `Erro ao salvar pedido ${orderDetail.order_sn}: ${error.message}`;
                console.error(errorMsg);
                errors.push(errorMsg);
              }
            }

            // Delay entre lotes
            if (i + detailBatchSize < orders.length) {
              await this.sleep(this.options.delayBetweenBatches);
            }

          } catch (error) {
            const errorMsg = `Erro ao buscar detalhes do lote de pedidos: ${error.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        cursor = orderList.response.next_cursor;
        hasMore = !!cursor;

        // Delay entre páginas
        await this.sleep(this.options.delayBetweenBatches);
      }

      console.log(`[Sync] Sincronização de pedidos concluída: ${processed} pedidos processados`);

    } catch (error) {
      errors.push(`Erro na sincronização de pedidos: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    return { success: errors.length === 0, processed, errors, duration };
  }

  /**
   * Salva um pedido no banco de dados
   */
  private async saveOrder(order: any): Promise<void> {
    try {
      console.log(`[Sync] Processando pedido:`, {
        order_sn: order.order_sn,
        order_status: order.order_status,
        total_amount: order.total_amount
      });

      const existingOrder = await storage.getOrderByOrderSn(order.order_sn);

      const orderData = {
        storeId: this.storeId,
        orderSn: order.order_sn,
        orderStatus: this.mapOrderStatus(order.order_status),
        totalAmount: Number(order.total_amount) || 0,
        currency: order.currency || 'BRL',
        paymentMethod: order.payment_method || '',
        shippingCarrier: order.shipping_carrier || '',
        trackingNumber: order.tracking_no || '',
        createTime: new Date(order.create_time * 1000),
        updateTime: new Date(order.update_time * 1000),
        buyerUsername: order.buyer_username || '',
        recipientAddress: JSON.stringify(order.recipient_address || {}),
        items: JSON.stringify(order.item_list || []),
        lastSyncAt: new Date()
      };

      if (existingOrder) {
        await storage.updateOrder(existingOrder.id, {
          ...orderData,
          updatedAt: new Date()
        });
        console.log(`[Sync] Pedido ${order.order_sn} atualizado`);
      } else {
        await storage.createOrder({
          ...orderData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`[Sync] Pedido ${order.order_sn} criado`);
      }
    } catch (error) {
      console.error(`[Sync] Erro ao salvar pedido:`, error);
      throw error;
    }
  }

  /**
   * Mapeia status do pedido da Shopee para o sistema local
   */
  private mapOrderStatus(shopeeStatus: string): string {
    const statusMap: Record<string, string> = {
      'UNPAID': 'pending',
      'TO_SHIP': 'confirmed',
      'SHIPPED': 'shipped',
      'TO_CONFIRM_RECEIVE': 'delivered',
      'IN_CANCEL': 'cancelling',
      'CANCELLED': 'cancelled',
      'TO_RETURN': 'returning',
      'COMPLETED': 'completed'
    };

    return statusMap[shopeeStatus] || 'unknown';
  }

  /**
   * Salva um produto no banco de dados
   */
  private async saveProduct(product: any): Promise<void> {
    try {
      console.log(`[Sync] Processando produto:`, {
        item_id: product.item_id,
        item_name: product.item_name,
        status: product.status
      });

      const existingProduct = await storage.getProductsByStoreId(this.storeId, 1, 0)
        .then(products => products.find(p => p.productId === String(product.item_id)));

      // Extrair dados com fallbacks seguros
      const itemId = product.item_id || product.id;
      const itemName = product.item_name || product.name || 'Produto sem nome';
      const description = product.description || '';
      
      // Extrair preço com múltiplos caminhos possíveis
      let price = 0;
      if (product.price_info?.current_price) {
        price = product.price_info.current_price;
      } else if (product.price_info?.original_price) {
        price = product.price_info.original_price;
      } else if (product.price) {
        price = product.price;
      }

      // Extrair estoque com múltiplos caminhos possíveis
      let stock = 0;
      if (product.stock_info?.current_stock !== undefined) {
        stock = product.stock_info.current_stock;
      } else if (product.stock_info?.normal_stock !== undefined) {
        stock = product.stock_info.normal_stock;
      } else if (product.stock !== undefined) {
        stock = product.stock;
      }

      // Extrair imagens
      let images: string[] = [];
      if (product.image?.image_url_list) {
        images = product.image.image_url_list;
      } else if (product.images && Array.isArray(product.images)) {
        images = product.images;
      } else if (product.image_urls && Array.isArray(product.image_urls)) {
        images = product.image_urls;
      }

      const productData = {
        storeId: this.storeId,
        productId: String(itemId),
        name: itemName,
        description: description,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        images: images,
        category: product.category_id ? String(product.category_id) : '',
        status: this.mapProductStatus(product.status),
        lastSyncAt: new Date()
      };

      console.log(`[Sync] Dados do produto mapeados:`, productData);

      if (existingProduct) {
        await storage.updateProduct(existingProduct.id, {
          ...productData,
          updatedAt: new Date()
        });
        console.log(`[Sync] Produto ${itemId} atualizado`);
      } else {
        await storage.createProduct({
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`[Sync] Produto ${itemId} criado`);
      }
    } catch (error) {
      console.error(`[Sync] Erro ao salvar produto:`, error);
      throw error;
    }
  }

  /**
   * Mapeia status do produto da Shopee para o sistema local
   */
  private mapProductStatus(shopeeStatus: string): 'active' | 'inactive' | 'deleted' {
    switch (shopeeStatus?.toLowerCase()) {
      case 'normal':
      case 'live':
        return 'active';
      case 'banned':
      case 'deleted':
        return 'deleted';
      default:
        return 'inactive';
    }
  }

  /**
   * Executa uma função com retry em caso de erro
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.options.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Backoff exponencial
          console.warn(`[Sync] Tentativa ${attempt} falhou, tentando novamente em ${delay}ms: ${error.message}`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Função utilitária para sincronizar uma loja específica
 */
export async function syncStore(storeId: number): Promise<SyncResult> {
  try {
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

    // Criar gerenciador de sincronização
    const syncManager = new ShopeeSyncManager(client, storeId);

    // Executar sincronização
    return await syncManager.syncAll();

  } catch (error) {
    return {
      success: false,
      processed: 0,
      errors: [error.message],
      duration: 0
    };
  }
}
