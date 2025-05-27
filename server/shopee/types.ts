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
  country: string;
}

// Informações de produto da Shopee
export interface ShopeeProduct {
  item_id: number;
  item_name: string;
  item_status: string;
  create_time: number;
  update_time: number;
  description: string;
  price_info: {
    current_price: number;
    original_price: number;
    inflated_price_of_current_price: number;
    inflated_price_of_original_price: number;
  };
  stock_info: {
    current_stock: number;
    normal_stock: number;
    reserved_stock: number;
  };
  category_id: number;
  brand: {
    brand_id: number;
    original_brand_name: string;
  };
  weight: number;
  dimension: {
    package_length: number;
    package_width: number;
    package_height: number;
  };
}

// Resposta da lista de produtos
export interface ShopeeProductListResponse {
  item: ShopeeProduct[];
  total_count: number;
  has_next_page: boolean;
  next_offset: string;
}

// Informações de pedido da Shopee
export interface ShopeeOrder {
  order_sn: string;
  order_status: string;
  create_time: number;
  update_time: number;
  days_to_ship: number;
  ship_by_date: number;
  buyer_user_id: number;
  buyer_username: string;
  estimated_shipping_fee: number;
  recipient_address: {
    name: string;
    phone: string;
    town: string;
    district: string;
    city: string;
    state: string;
    region: string;
    zipcode: string;
    full_address: string;
  };
  actual_shipping_fee: number;
  goods_to_declare: boolean;
  note: string;
  note_update_time: number;
  item_list: Array<{
    item_id: number;
    item_name: string;
    item_sku: string;
    model_id: number;
    model_name: string;
    model_sku: string;
    model_quantity_purchased: number;
    model_original_price: number;
    model_discounted_price: number;
    wholesale: boolean;
    weight: number;
    add_on_deal: boolean;
    main_item: boolean;
    add_on_deal_id: number;
    promotion_type: string;
    promotion_id: number;
    order_item_id: number;
    promotion_group_id: number;
    image_info: {
      image_url: string;
    };
  }>;
  pay_time: number;
  dropshipper: string;
  dropshipper_phone: string;
  split_up: boolean;
  buyer_cancel_reason: string;
  cancel_by: string;
  cancel_reason: string;
  actual_shipping_fee_confirmed: boolean;
  buyer_cpf_id: string;
  fulfillment_flag: string;
  pickup_done_time: number;
  package_list: Array<{
    package_number: string;
    logistics_status: string;
    shipping_carrier: string;
    item_list: Array<{
      item_id: number;
      model_id: number;
      order_item_id: number;
      promotion_group_id: number;
    }>;
  }>;
  invoice_data: {
    number: string;
    series_number: string;
    access_key: string;
    issue_date: number;
    total_value: number;
    products_total_value: number;
    tax_total_value: number;
  };
}

// Resposta da lista de pedidos
export interface ShopeeOrderListResponse {
  more: boolean;
  order_list: ShopeeOrder[];
}

// Webhook da Shopee
export interface ShopeeWebhookEvent {
  code: number;
  shop_id: number;
  timestamp: number;
  data: any;
}

// Categorias da Shopee
export interface ShopeeCategory {
  category_id: number;
  parent_category_id: number;
  original_category_name: string;
  display_category_name: string;
  has_children: boolean;
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

// Evento de webhook da Shopee
export interface WebhookEvent {
  code: number;
  data: any;
  shop_id: number;
  timestamp: number;
  msg_id?: string;
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
  revenue_30_days: number;days: number;
}