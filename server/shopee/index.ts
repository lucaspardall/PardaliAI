/**
 * Interface principal para interação com a API Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { storage } from '../storage';

// Configuração padrão para ambiente de desenvolvimento
const DEFAULT_CONFIG: ShopeeAuthConfig = {
  partnerId: process.env.SHOPEE_PARTNER_ID || '',
  partnerKey: process.env.SHOPEE_PARTNER_KEY || '',
  redirectUrl: process.env.SHOPEE_REDIRECT_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/shopee/callback`,
  region: 'BR'
};

/**
 * Cria uma instância do cliente Shopee a partir da configuração fornecida ou padrão
 * @param config Configuração personalizada (opcional)
 */
export function createClient(config: Partial<ShopeeAuthConfig> = {}): ShopeeClient {
  const fullConfig: ShopeeAuthConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  
  if (!fullConfig.partnerId || !fullConfig.partnerKey) {
    throw new Error('Shopee API credentials not provided. Please set SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY environment variables.');
  }
  
  return new ShopeeClient(fullConfig);
}

/**
 * Carrega um cliente Shopee com os tokens de autenticação de uma loja específica
 * @param shopId ID da loja na Shopee
 */
export async function loadShopeeClientForStore(shopId: string): Promise<ShopeeClient | null> {
  try {
    // Buscar a loja no armazenamento
    const store = await storage.getStoreByShopId(shopId);
    
    if (!store) {
      return null;
    }
    
    // Verificar se os tokens estão presentes
    if (!store.accessToken || !store.refreshToken || !store.tokenExpiresAt) {
      return null;
    }
    
    // Criar cliente com a configuração padrão
    const client = createClient({
      region: store.shopRegion as any
    });
    
    // Definir tokens
    client.setTokens({
      accessToken: store.accessToken,
      refreshToken: store.refreshToken,
      expiresAt: store.tokenExpiresAt,
      shopId: store.shopId
    });
    
    return client;
  } catch (error) {
    console.error('Error loading Shopee client for store:', error);
    return null;
  }
}

// Exportar funções e classes úteis
export * from './types';
export * from './auth';
export * from './client';
export * from './utils';
export * from './endpoints';
export * from './cache';