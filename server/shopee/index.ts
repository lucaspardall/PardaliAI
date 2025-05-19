
/**
 * Interface principal para interação com a API Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { storage } from '../storage';
import { getTokenCache } from './cache';

// Configuração padrão para ambiente de desenvolvimento
const DEFAULT_CONFIG: ShopeeAuthConfig = {
  partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
  partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
  redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cip-shopee.replit.app/api/shopee/callback',
  region: 'BR'
};

/**
 * Cria uma instância do cliente API da Shopee
 * @param config Configuração opcional (usa valores padrão se não fornecida)
 */
export function createClient(config?: Partial<ShopeeAuthConfig>): ShopeeClient {
  const fullConfig: ShopeeAuthConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    // Customizar URL de redirecionamento baseado no ambiente
    redirectUrl: process.env.NODE_ENV === 'development' 
      ? `${process.env.REPLIT_URL || 'http://localhost:5000'}/api/shopee/callback` 
      : (config?.redirectUrl || DEFAULT_CONFIG.redirectUrl)
  };
  
  // Inicializar o cache de tokens se ainda não existir
  const tokenCache = getTokenCache();
  
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
