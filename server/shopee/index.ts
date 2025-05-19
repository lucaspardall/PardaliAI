
/**
 * Interface principal para interação com a API Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { storage } from '../storage';
import { ShopeeCache } from './cache';

// Configuração padrão para ambiente de desenvolvimento
const DEFAULT_CONFIG: ShopeeAuthConfig = {
  partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
  partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
  redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
  region: 'BR'
};

/**
 * Cria uma instância do cliente API da Shopee
 * @param config Configuração opcional (usa valores padrão se não fornecida)
 */
export function createClient(config?: Partial<ShopeeAuthConfig>): ShopeeClient {
  // Configurar URL de redirecionamento com base no ambiente
  let redirectUrl = config?.redirectUrl || DEFAULT_CONFIG.redirectUrl;
  
  // Em ambiente de desenvolvimento, usamos a URL do Replit
  if (process.env.NODE_ENV === 'development') {
    // Obter a URL do Replit a partir do ambiente
    const replitUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : process.env.REPLIT_URL;
    
    // Usar a URL do Replit se disponível, caso contrário localhost
    const baseUrl = replitUrl || 'https://cipshopee.replit.app';
    redirectUrl = `${baseUrl}/api/shopee/callback`;
    console.log(`[Ambiente de desenvolvimento] URL de redirecionamento configurada: ${redirectUrl}`);
  } else {
    console.log(`[Ambiente de produção] URL de redirecionamento configurada: ${redirectUrl}`);
  }
  
  const fullConfig: ShopeeAuthConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    redirectUrl
  };
  
  // Inicializar o cache (já está sendo feito pela importação)
  
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
