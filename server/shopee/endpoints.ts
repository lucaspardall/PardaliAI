/**
 * Definição de endpoints da API Shopee
 */

// Endpoints de autenticação
export const AUTH = {
  // API para o fluxo de autorização (não usamos URL completa, pois varia por região)
  AUTHORIZE: '/api/v2/shop/auth_partner',
  GET_TOKEN: '/api/v2/auth/token/get',
  REFRESH_TOKEN: '/api/v2/auth/access_token/get'
};

// Endpoints de loja
export const SHOP = {
  GET_INFO: '/api/v2/shop/get_shop_info',
  GET_PROFILE: '/api/v2/shop/get_profile',
  UPDATE_PROFILE: '/api/v2/shop/update_profile'
};

// Endpoints de produtos
export const PRODUCT = {
  GET_LIST: '/api/v2/product/get_item_list',
  GET_BASE_INFO: '/api/v2/product/get_item_base_info',
  GET_DETAIL: '/api/v2/product/get_item_detail',
  UPDATE_ITEM: '/api/v2/product/update_item'
};

// Endpoints de métricas
export const METRICS = {
  GET_SHOP_PERFORMANCE: '/api/v2/shop/get_shop_performance',
  GET_ITEM_PERFORMANCE: '/api/v2/product/get_item_promotion'
};