/**
 * Endpoints da API Shopee
 */

// URLs base por região
export const BASE_URLS: Record<string, string> = {
  BR: 'https://open-api.shopee.com.br',
  // Adicione outras regiões conforme necessário
  SG: 'https://open-api.shopee.sg',
  MY: 'https://open-api.shopee.com.my',
  ID: 'https://open-api.shopee.co.id',
  TW: 'https://open-api.shopee.tw',
  VN: 'https://open-api.shopee.vn',
  TH: 'https://open-api.shopee.co.th',
  PH: 'https://open-api.shopee.ph',
  MX: 'https://open-api.shopee.mx',
  CO: 'https://open-api.shopee.com.co',
  CL: 'https://open-api.shopee.cl',
};

// Autenticação OAuth
export const AUTH = {
  AUTHORIZE: '/api/v2/shop/auth_partner',
  GET_TOKEN: '/api/v2/auth/token/get',
  REFRESH_TOKEN: '/api/v2/auth/access_token/get',
};

// Produtos
export const PRODUCT = {
  GET_ITEM_LIST: '/api/v2/product/get_item_list',
  GET_ITEM_BASE_INFO: '/api/v2/product/get_item_base_info',
  GET_MODEL_LIST: '/api/v2/product/get_model_list',
  UPDATE_ITEM: '/api/v2/product/update_item',
  UPDATE_STOCK: '/api/v2/product/update_stock',
  UPDATE_PRICE: '/api/v2/product/update_price',
};

// Métricas e estatísticas
export const METRICS = {
  GET_SHOP_PERFORMANCE: '/api/v2/shop/get_shop_performance',
  GET_ITEM_PERFORMANCE: '/api/v2/product/get_item_performance',
  GET_ACCOUNT_HEALTH: '/api/v2/account_health/shop_performance',
};

// Loja
export const SHOP = {
  GET_SHOP_INFO: '/api/v2/shop/get_shop_info',
  GET_PROFILE: '/api/v2/shop/get_profile',
  UPDATE_PROFILE: '/api/v2/shop/update_profile',
};