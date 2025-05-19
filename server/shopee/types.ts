/**
 * Tipos de dados para a API da Shopee
 */

// Regiões suportadas pela API da Shopee
export type ShopeeRegion = 'SG' | 'MY' | 'TH' | 'TW' | 'ID' | 'VN' | 'PH' | 'BR' | 'MX' | 'CO' | 'CL' | 'PL' | 'ES' | 'FR';

// Configuração para autenticação com a API da Shopee
export interface ShopeeAuthConfig {
  partnerId: string;
  partnerKey: string;
  redirectUrl: string;
  region: ShopeeRegion;
}

// Tokens de autenticação da API da Shopee
export interface ShopeeAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  shopId: string;
}

// Formato padrão de resposta da API da Shopee
export interface ShopeeApiResponse<T = any> {
  request_id?: string;
  error?: string;
  message?: string;
  response: T;
}

// Erro da API da Shopee
export interface ShopeeApiError {
  error: string;
  message: string;
  requestId?: string;
  response?: any;
}

// Informações básicas de uma loja Shopee
export interface ShopeeShopInfo {
  shop_id: number;
  shop_name: string;
  shop_status: string;
  is_cb: boolean;
  description: string;
  images: string[];
  disable_make_offer: number;
  enable_display_unitno: boolean;
  item_limit: number;
  logo: string;
  region: string;
}

// Informações de um produto na Shopee
export interface ShopeeProductItem {
  item_id: number;
  category_id: number;
  item_name: string;
  description: string;
  item_sku: string;
  create_time: number;
  update_time: number;
  price_info: {
    currency: string;
    original_price: number;
    current_price: number;
  };
  stock_info: {
    stock_type: number;
    current_stock: number;
    normal_stock: number;
    reserved_stock: number;
  };
  image: {
    image_url_list: string[];
  };
  weight: string;
  dimension: {
    package_length: number;
    package_width: number;
    package_height: number;
  };
  status: string;
  has_model: boolean;
  condition: string;
}

// Resposta da listagem de produtos
export interface ShopeeProductListResponse {
  item: ShopeeProductItem[];
  total_count: number;
  has_next_page: boolean;
  next_offset: number;
}

// Métricas de desempenho de uma loja
export interface ShopeeShopPerformance {
  shop_performance: {
    listing_rate: {
      target: number;
      my_shop_performance: number;
      penalty_score: number;
    };
    shipping_rate: {
      target: number;
      my_shop_performance: number;
      penalty_score: number;
    };
    response_rate: {
      target: number;
      my_shop_performance: number;
      penalty_score: number;
    };
    cancellation_rate: {
      target: number;
      my_shop_performance: number;
      penalty_score: number;
    };
    return_refund_rate: {
      target: number;
      my_shop_performance: number;
      penalty_score: number;
    };
    total_penalty_points: number;
  };
}

// Métricas de desempenho de um produto
export interface ShopeeProductPerformance {
  item_id: number;
  views: number;
  likes: number;
  add_to_cart: number;
  views_percentage: number;
  likes_percentage: number;
  add_to_cart_percentage: number;
  conversion_rate: number;
  sales_30_days: number;
  revenue_30_days: number;
}