/**
 * Interface principal para interação com a API Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { storage } from '../storage';
import { ShopeeCache } from './cache';

// Configuração padrão para produção no Brasil
const DEFAULT_CONFIG: ShopeeAuthConfig = {
  partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
  partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4761',
  // URL de produção para callback da Shopee
  redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
  region: process.env.SHOPEE_REGION || 'BR'  // Brasil como região padrão para produção
};

/**
 * Cria uma instância do cliente API da Shopee
 * @param config Configuração opcional (usa valores padrão se não fornecida)
 */
export function createClient(config?: Partial<ShopeeAuthConfig>): ShopeeClient {
  // Produção: Usar região BR (Brasil) como padrão
  const region = process.env.SHOPEE_REGION || 'BR'; 

  // URL de produção configurada
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';

  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Shopee Client] Configurando cliente com redirectUrl: ${redirectUrl} e região: ${region}`);
  }

  // Configuração otimizada para produção
  const fullConfig: ShopeeAuthConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    redirectUrl,
    region
  };

  // Log de configuração apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Shopee Client] Configuração final:`, {
      partnerId: fullConfig.partnerId,
      region: fullConfig.region,
      redirectUrl: fullConfig.redirectUrl
    });
  }

  const client = new ShopeeClient(fullConfig);
  
  // Configurar headers específicos para Brasil em produção
  if (region === 'BR') {
    client.setRequestHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'X-Shopee-Region': 'BR',
      'X-Shopee-Country': 'BR'
    });
  }

  return client;
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
export * from './data';
export * from './endpoints';
export * from './cache';