/**
 * Interface principal para API Shopee - Versão simplificada
 */
import { ShopeeClient } from './client';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { getShopeeConfig } from './config';
import { storage } from '../storage';

/**
 * Cria cliente Shopee com configuração padrão
 */
export function createClient(config?: Partial<ShopeeAuthConfig>): ShopeeClient {
  const fullConfig = getShopeeConfig(config);
  return new ShopeeClient(fullConfig);
}

/**
 * Carrega cliente para loja específica
 */
export async function loadClientForStore(shopId: string): Promise<ShopeeClient | null> {
  try {
    const store = await storage.getStoreByShopId(shopId);

    if (!store?.accessToken || !store?.refreshToken || !store?.tokenExpiresAt) {
      return null;
    }

    const client = createClient({
      region: store.shopRegion as any
    });

    client.setTokens({
      accessToken: store.accessToken,
      refreshToken: store.refreshToken,
      expiresAt: store.tokenExpiresAt,
      shopId: store.shopId
    });

    return client;
  } catch (error) {
    console.error('Error loading client for store:', error);
    return null;
  }
}

// Re-exports limpos
export * from './types';
export * from './client';
export * from './auth';
export * from './utils';
export * from './data';
export * from './sync';
export { ShopeeCache } from './cache';