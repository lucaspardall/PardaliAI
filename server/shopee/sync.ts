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
      } catch (error: any) {
        errors.push(`Erro ao sincronizar informações da loja: ${error.message || 'Erro desconhecido'}`);
      }

      // 2. Sincronizar produtos
      try {
        const productResult = await this.syncProducts();
        processed += productResult.processed;
        console.log(`[Sync] ${productResult.processed} produtos sincronizados`);
      } catch (error: any) {
        errors.push(`Erro ao sincronizar produtos: ${error.message || 'Erro desconhecido'}`);
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      return {
        success,
        processed,
        errors,
        duration
      };
    } catch (error: any) {
      console.error(`[Sync] Erro geral na sincronização:`, error);
      const duration = Date.now() - startTime;

      return {
        success: false,
        processed,
        errors: [...errors, error.message || 'Erro desconhecido'],
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

        console.log(`[Sync] Encontrados ${items.length} produtos no batch`);

        // Processar cada produto
        for (const item of items) {
          try {
            // Buscar detalhes do produto
            const productDetails = await this.withRetry(async () => {
              return await getProductDetails(this.client, item.item_id);
            });

            // Salvar produto no banco de dados
            await storage.upsertProduct({
              storeId: this.storeId,
              itemId: item.item_id.toString(),
              name: productDetails.item_name || 'Produto sem nome',
              description: productDetails.description || '',
              price: productDetails.price_info?.[0]?.current_price || 0,
              stock: productDetails.stock_info?.[0]?.current_stock || 0,
              status: productDetails.item_status || 'unknown',
              images: productDetails.images || [],
              updatedAt: new Date(),
              createdAt: new Date()
            });

            processed++;
          } catch (error: any) {
            console.error(`[Sync] Erro ao processar produto ${item.item_id}:`, error);
            errors.push(`Produto ${item.item_id}: ${error.message}`);
          }
        }

        // Atualizar offset para próximo batch
        offset += items.length;

        // Se retornou menos itens que o batch size, não há mais dados
        if (items.length < this.options.batchSize) {
          hasMore = false;
        }

        // Delay entre batches para respeitar rate limits
        if (hasMore && this.options.delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[Sync] Sincronização de produtos concluída: ${processed} processados em ${duration}ms`);

      return {
        success: errors.length === 0,
        processed,
        errors,
        duration
      };

    } catch (error: any) {
      console.error(`[Sync] Erro na sincronização de produtos:`, error);
      const duration = Date.now() - startTime;

      return {
        success: false,
        processed,
        errors: [...errors, error.message || 'Erro desconhecido'],
        duration
      };
    }
  }

  /**
   * Executa uma função com retry
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = this.options.maxRetries): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        console.warn(`[Sync] Tentativa ${attempt}/${maxRetries} falhou:`, error.message);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * attempt, 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}

/**
 * Função de conveniência para sincronizar uma loja
 */
export async function syncStore(storeId: number): Promise<SyncResult> {
  try {
    // Carregar store do banco
    const store = await storage.getStoreById(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    // Carregar cliente Shopee
    const { loadShopeeClientForStore } = await import('./index');
    const client = await loadShopeeClientForStore(store.shopId);

    if (!client) {
      throw new Error(`Failed to load Shopee client for store ${storeId}`);
    }

    // Executar sincronização
    const syncManager = new ShopeeSyncManager(client, storeId);
    return await syncManager.syncAll();

  } catch (error: any) {
    console.error(`[Sync] Error syncing store ${storeId}:`, error);

    return {
      success: false,
      processed: 0,
      errors: [error.message || 'Unknown error'],
      duration: 0
    };
  }
}