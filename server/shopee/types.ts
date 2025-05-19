/**
 * Tipos para a integração da API Shopee
 */

export interface ShopeeAuthConfig {
  partnerId: string;
  partnerKey: string;
  redirectUrl: string;
  region: ShopeeRegion;
}

export type ShopeeRegion = 'BR' | 'SG' | 'MY' | 'TW' | 'ID' | 'VN' | 'TH' | 'PH' | 'MX' | 'CO' | 'CL';

export interface ShopeeAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  shopId: string;
}

export interface ShopeeApiError {
  error: string;
  message: string;
  requestId?: string;
}

export interface ShopeeApiResponse<T> {
  error: string;
  message: string;
  response: T;
  request_id: string;
}

// Tipos para resposta de produtos
export interface ShopeeProduct {
  item_id: number;
  shop_id: number;
  item_name: string;
  item_sku: string;
  create_time: number;
  update_time: number;
  price_info: {
    currency: string;
    original_price: number;
    current_price: number;
  }[];
  stock_info: {
    stock_type: number;
    stock_value: number;
  }[];
  image: {
    image_url_list: string[];
  };
  description: string;
  weight: number;
  dimension: {
    width: number;
    height: number;
    length: number;
  };
  category_id: number;
  original_price: number;
  package_length: number;
  package_width: number;
  package_height: number;
  days_to_ship: number;
  condition: string;
  status: string;
  has_model: boolean;
  promotion_id: number;
  brand: {
    brand_id: number;
    original_brand_name: string;
  };
  item_status: string;
  item_dangerous: number;
}

export interface ShopeeProductsResponse {
  item: ShopeeProduct[];
  total_count: number;
  has_next_page: boolean;
  next_offset: number;
}

// Tipos para métricas da loja
export interface ShopeeMetrics {
  total_views: number;
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  conversion_rate: number;
}

// Tipos para informações da loja
export interface ShopeeShopInfo {
  shop_id: number;
  shop_name: string;
  region: string;
  status: string;
  shop_logo: string;
  auth_time: number;
  expire_time: number;
}