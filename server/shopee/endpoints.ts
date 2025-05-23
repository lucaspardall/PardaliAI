
/**
 * Endpoints da API Shopee
 * Centraliza as definições de caminhos de API para facilitar manutenção
 */

// Endpoints de autenticação
export const AUTH = {
  // Obter token de acesso através do código de autorização
  GET_TOKEN: '/api/v2/auth/token/get',
  
  // Renovar token de acesso através do refresh token
  REFRESH_TOKEN: '/api/v2/auth/access_token/get',
  
  // Revogar token de acesso (logout)
  REVOKE_TOKEN: '/api/v2/auth/token/revoke'
};

// Endpoints relacionados à loja
export const SHOP = {
  // Obter informações da loja
  GET_INFO: '/api/v2/shop/get_shop_info',
  
  // Obter as configurações da loja (moeda, idioma, etc.)
  GET_SETTINGS: '/api/v2/shop/get_shop_settings',
  
  // Obter o nível de performance da loja
  GET_PERFORMANCE: '/api/v2/shop/get_shop_performance'
};

// Endpoints relacionados a produtos
export const PRODUCT = {
  // Listar produtos
  GET_LIST: '/api/v2/product/get_item_list',
  
  // Obter informações detalhadas de produtos
  GET_DETAIL: '/api/v2/product/get_item_base_info',
  
  // Obter lista de categorias
  GET_CATEGORIES: '/api/v2/product/get_category'
};

// Endpoints relacionados a pedidos
export const ORDER = {
  // Listar pedidos
  GET_LIST: '/api/v2/order/get_order_list',
  
  // Obter detalhes de um pedido
  GET_DETAIL: '/api/v2/order/get_order_detail',
  
  // Obter o rastreamento de um pedido
  GET_TRACKING: '/api/v2/logistics/get_tracking_info'
};

// Endpoints relacionados a logística
export const LOGISTICS = {
  // Obter opções de envio
  GET_SHIPPING_OPTIONS: '/api/v2/logistics/get_shipping_parameter',
  
  // Obter informações de rastreamento
  GET_TRACKING_INFO: '/api/v2/logistics/get_tracking_info'
};

// Endpoints relacionados a finanças
export const FINANCE = {
  // Obter transações
  GET_TRANSACTIONS: '/api/v2/payment/get_transaction_list',
  
  // Obter saldo da conta
  GET_BALANCE: '/api/v2/payment/get_wallet_transactions'
};

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