
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
 * Cria um cliente da API Shopee com configuração padrão ou personalizada
 * @param config Configuração opcional para sobrescrever os valores padrão
 */
export function createClient(config?: Partial<ShopeeAuthConfig>): ShopeeClient {
  // Mesclar configuração fornecida com valores padrão
  const fullConfig: ShopeeAuthConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  
  // Garantir que temos uma URL de redirecionamento
  if (!fullConfig.redirectUrl) {
    fullConfig.redirectUrl = 'https://cipshopee.replit.app/api/shopee/callback';
  }
  
  return new ShopeeClient(fullConfig);
}mento
const DEFAULT_CONFIG: ShopeeAuthConfig = {
  partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
  partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
  // Sempre usar o domínio de produção cipshopee.replit.app como URL de redirecionamento
  redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
  region: process.env.SHOPEE_REGION || 'SG'  // Alterado para SG (Singapura) como no Upseller
};

/**
 * Cria uma instância do cliente API da Shopee
 * @param config Configuração opcional (usa valores padrão se não fornecida)
 */
export function createClient(config?: Partial<ShopeeAuthConfig>): ShopeeClient {
  // Usar região SG (Singapura) conforme exemplos encontrados no Upseller
  const region = process.env.SHOPEE_REGION || 'SG'; 
  
  // Usar sempre o domínio de produção para integrações Shopee
  const currentUrl = 'https://cipshopee.replit.app';
  
  // Configurar URL de redirecionamento garantindo formato correto e absoluto
  // A URL de redirecionamento deve ser URL completa e absoluta conforme documentação
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback';
  
  console.log(`[Shopee Client] Configurando cliente com redirectUrl: ${redirectUrl} e região: ${region}`);
  
  // Mesclar configurações com valores explícitos
  const fullConfig: ShopeeAuthConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    redirectUrl,  // Usar sempre URL absoluta
    region        // Usar a região configurada
  };
  
  console.log(`[Shopee Client] Configuração final:`, {
    partnerId: fullConfig.partnerId,
    region: fullConfig.region,
    redirectUrl: fullConfig.redirectUrl
  });
  
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
export * from './data';
export * from './endpoints';
export * from './cache';
