
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
      while (hasMore) {
        console.log(`[Sync] Buscando produtos (offset: ${offset}, batch: ${this.options.batchSize})`);

        // Buscar lista de produtos
        const productList = await this.withRetry(async () => {
          return await getProductList(this.client, offset, this.options.batchSize);
        });

        if (!productList?.item || productList.item.length === 0) {
          hasMore = false;
          break;
        }

        // Processar produtos em lotes menores para detalhes
        const itemIds = productList.item.map(item => item.item_id);
        const detailBatchSize = Math.min(20, itemIds.length); // Shopee limita detalhes em lotes menores

        for (let i = 0; i < itemIds.length; i += detailBatchSize) {
          const batchIds = itemIds.slice(i, i + detailBatchSize);
          
          try {
            // Buscar detalhes dos produtos
            const productDetails = await this.withRetry(async () => {
              return await getProductDetails(this.client, batchIds);
            });

            if (productDetails?.item_list) {
              // Salvar produtos no banco
              for (const product of productDetails.item_list) {
                try {
                  await this.saveProduct(product);
                  processed++;
                } catch (error) {
                  errors.push(`Erro ao salvar produto ${product.item_id}: ${error.message}`);
                }
              }
            }

            // Delay entre lotes para evitar rate limiting
            if (i + detailBatchSize < itemIds.length) {
              await this.sleep(this.options.delayBetweenBatches);
            }

          } catch (error) {
            errors.push(`Erro ao buscar detalhes do lote ${i}-${i + detailBatchSize}: ${error.message}`);
          }
        }

        // Verificar se há mais páginas
        hasMore = productList.has_next_page || false;
        offset += this.options.batchSize;

        // Delay entre páginas
        await this.sleep(this.options.delayBetweenBatches);
      }

      // Atualizar total de produtos na loja
      await storage.updateStore(this.storeId, {
        totalProducts: processed
      });

    } catch (error) {
      errors.push(`Erro geral na sincronização: ${error.message}`);
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

        if (!orderList?.order_list || orderList.order_list.length === 0) {
          hasMore = false;
          break;
        }

        processed += orderList.order_list.length;
        cursor = orderList.next_cursor;
        hasMore = !!cursor;

        // Delay entre páginas
        await this.sleep(this.options.delayBetweenBatches);
      }

    } catch (error) {
      errors.push(`Erro na sincronização de pedidos: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    return { success: errors.length === 0, processed, errors, duration };
  }

  /**
   * Salva um produto no banco de dados
   */
  private async saveProduct(product: any): Promise<void> {
    const existingProduct = await storage.getProductsByStoreId(this.storeId, 1, 0)
      .then(products => products.find(p => p.productId === String(product.item_id)));

    const productData = {
      storeId: this.storeId,
      productId: String(product.item_id),
      name: product.item_name || 'Produto sem nome',
      description: product.description || '',
      price: product.price_info?.current_price || 0,
      stock: product.stock_info?.current_stock || 0,
      images: product.image?.image_url_list || [],
      category: product.category_id ? String(product.category_id) : '',
      status: this.mapProductStatus(product.status),
      lastSyncAt: new Date()
    };

    if (existingProduct) {
      await storage.updateProduct(existingProduct.id, productData);
    } else {
      await storage.createProduct({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
