
/**
 * Configuração centralizada para API Shopee
 */
import { ShopeeAuthConfig, ShopeeRegion } from './types';

// Configuração padrão para produção
export const DEFAULT_SHOPEE_CONFIG: ShopeeAuthConfig = {
  partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
  partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4761',
  redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
  region: (process.env.SHOPEE_REGION as ShopeeRegion) || 'BR'
};

// URLs base por região
export const API_BASE_URLS: Record<ShopeeRegion, string> = {
  SG: 'https://partner.shopeemobile.com',
  MY: 'https://partner.shopeemobile.com',
  TH: 'https://partner.shopeemobile.com',
  TW: 'https://partner.shopeemobile.com',
  ID: 'https://partner.shopeemobile.com',
  VN: 'https://partner.shopeemobile.com',
  PH: 'https://partner.shopeemobile.com',
  BR: 'https://partner.shopeemobile.com',
  MX: 'https://partner.shopeemobile.com',
  CO: 'https://partner.shopeemobile.com',
  CL: 'https://partner.shopeemobile.com',
  PL: 'https://partner.shopeemobile.com',
  ES: 'https://partner.shopeemobile.com',
  FR: 'https://partner.shopeemobile.com'
};

// URLs de autorização por região
export const AUTH_BASE_URLS: Record<ShopeeRegion, string> = {
  SG: 'https://partner.shopeemobile.com',
  MY: 'https://partner.shopeemobile.com', 
  TH: 'https://partner.shopeemobile.com',
  TW: 'https://partner.shopeemobile.com',
  ID: 'https://partner.shopeemobile.com',
  VN: 'https://partner.shopeemobile.com',
  PH: 'https://partner.shopeemobile.com',
  BR: 'https://partner.shopeemobile.com',
  MX: 'https://partner.shopeemobile.com',
  CO: 'https://partner.shopeemobile.com',
  CL: 'https://partner.shopeemobile.com',
  PL: 'https://partner.shopeemobile.com',
  ES: 'https://partner.shopeemobile.com',
  FR: 'https://partner.shopeemobile.com'
};

// Rate limits por tipo de operação
export const RATE_LIMITS = {
  READ: {
    maxConcurrent: 3,
    minTime: 1000,
    reservoir: 50,
    reservoirRefreshAmount: 50,
    reservoirRefreshInterval: 60 * 1000
  },
  WRITE: {
    maxConcurrent: 1,
    minTime: 2000,
    reservoir: 20,
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 60 * 1000
  },
  MEDIA: {
    maxConcurrent: 1,
    minTime: 5000,
    reservoir: 10,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 60 * 1000
  }
};

// TTL para cache por tipo de endpoint
export const CACHE_TTL = {
  SHOP_INFO: 60 * 60 * 1000,      // 1 hora
  CATEGORIES: 24 * 60 * 60 * 1000, // 24 horas
  ATTRIBUTES: 24 * 60 * 60 * 1000, // 24 horas
  PRODUCT_LIST: 10 * 60 * 1000,    // 10 minutos
  PRODUCT_DETAIL: 5 * 60 * 1000,   // 5 minutos
  ORDER_LIST: 2 * 60 * 1000,       // 2 minutos
  LOGISTICS: 60 * 60 * 1000        // 1 hora
};

export function getShopeeConfig(overrides?: Partial<ShopeeAuthConfig>): ShopeeAuthConfig {
  return {
    ...DEFAULT_SHOPEE_CONFIG,
    ...overrides
  };
}
