/**
 * Sistema de sincronização simplificado para Shopee
 */
import { ShopeeClient } from './client';
import { SyncOptions, SyncResult } from './types';
import { storage } from '../storage';
import { loadClientForStore } from './index';

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
      delayBetweenBatches: options.delayBetweenBatches || 1000
    };
  }

  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;

    try {
      console.log(`[Sync] Starting full sync for store ${this.storeId}`);

      // 1. Sync shop info
      try {
        await this.syncShopInfo();
        processed++;
      } catch (error: any) {
        errors.push(`Shop info sync error: ${error.message}`);
      }

      // 2. Sync products
      try {
        const productCount = await this.syncProducts();
        processed += productCount;
      } catch (error: any) {
        errors.push(`Products sync error: ${error.message}`);
      }

      // 3. Sync orders
      try {
        const orderCount = await this.syncOrders();
        processed += orderCount;
      } catch (error: any) {
        errors.push(`Orders sync error: ${error.message}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        processed,
        errors,
        duration,
        lastSyncAt: new Date()
      };

    } catch (error: any) {
      return {
        success: false,
        processed,
        errors: [error.message],
        duration: Date.now() - startTime,
        lastSyncAt: new Date()
      };
    }
  }

  private async syncShopInfo(): Promise<void> {
    const shopInfo = await this.client.get('/api/v2/shop/get_shop_info');

    // Save to database
    const store = await storage.getStoreByShopId(this.storeId.toString());
    if (store) {
      await storage.updateStore(store.id, {
        shopName: shopInfo.shop_name,
        shopStatus: shopInfo.shop_status,
        updatedAt: new Date()
      });
    }
  }

  private async syncProducts(): Promise<number> {
    let processed = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.client.get('/api/v2/product/get_item_list', {
        offset,
        page_size: this.options.batchSize
      });

      if (response.item && response.item.length > 0) {
        // Process products in batches
        for (const item of response.item) {
          await this.processProduct(item);
          processed++;
        }

        offset += this.options.batchSize;
        hasMore = response.has_next_page;

        // Delay between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
        }
      } else {
        hasMore = false;
      }
    }

    return processed;
  }

  private async syncOrders(): Promise<number> {
    let processed = 0;
    const timeFrom = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000); // Last 30 days
    const timeTo = Math.floor(Date.now() / 1000);

    let cursor = '';
    let hasMore = true;

    while (hasMore) {
      const params: any = {
        time_range_field: 'create_time',
        time_from: timeFrom,
        time_to: timeTo,
        page_size: this.options.batchSize
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const response = await this.client.get('/api/v2/order/get_order_list', params);

      if (response.order_list && response.order_list.length > 0) {
        for (const order of response.order_list) {
          await this.processOrder(order);
          processed++;
        }

        hasMore = response.more;
        cursor = response.next_cursor;

        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
        }
      } else {
        hasMore = false;
      }
    }

    return processed;
  }

  private async processProduct(item: any): Promise<void> {
    // TODO: Implement product processing logic
    console.log(`Processing product ${item.item_id}: ${item.item_name}`);
  }

  private async processOrder(order: any): Promise<void> {
    // TODO: Implement order processing logic
    console.log(`Processing order ${order.order_sn}`);
  }
}

/**
 * Sync store by ID
 */
export async function syncStore(storeId: string): Promise<SyncResult> {
  try {
    const store = await storage.getStoreById(parseInt(storeId));
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    const client = await loadClientForStore(store.shopId);
    if (!client) {
      throw new Error(`Failed to load client for store ${storeId}`);
    }

    const syncManager = new ShopeeSyncManager(client, parseInt(storeId));
    return await syncManager.syncAll();

  } catch (error: any) {
    console.error(`Error syncing store ${storeId}:`, error);

    return {
      success: false,
      processed: 0,
      errors: [error.message],
      duration: 0,
      lastSyncAt: new Date()
    };
  }
}