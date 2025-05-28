/**
 * Tipos completos para API Shopee
 */

export type ShopeeRegion = 'SG' | 'MY' | 'TH' | 'TW' | 'ID' | 'VN' | 'PH' | 'BR' | 'MX' | 'CO' | 'CL' | 'PL' | 'ES' | 'FR';

export interface ShopeeAuthConfig {
  partnerId: string;
  partnerKey: string;
  redirectUrl: string;
  region: ShopeeRegion;
}

export interface ShopeeAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  shopId: string;
}

export interface ShopeeApiResponse<T = any> {
  request_id?: string;
  error?: string;
  message?: string;
  response: T;
}

export interface ShopeeApiError {
  error: string;
  message: string;
  requestId?: string;
  response?: any;
}

export interface ShopeeShopInfo {
  shop_id: number;
  shop_name: string;
  shop_status: string;
  is_cb: boolean;
  description: string;
  images: string[];
  logo: string;
  region: string;
  country: string;
  item_limit: number;
  disable_make_offer: number;
  enable_display_unitno: boolean;
}

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

export interface ShopeeProductListResponse {
  item: ShopeeProductItem[];
  total_count: number;
  has_next_page: boolean;
  next_offset: number;
}

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
    full_address: string;
    district: string;
    city: string;
    state: string;
    region: string;
    zipcode: string;
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
  checkout_shipping_carrier: string;
  reverse_shipping_fee: number;
  order_chargeable_weight_gram: number;
}

export interface ShopeeOrderListResponse {
  more: boolean;
  order_list: ShopeeOrder[];
}

export interface ShopeeCategory {
  category_id: number;
  parent_category_id: number;
  original_category_name: string;
  display_category_name: string;
  has_children: boolean;
}

export interface ShopeeWebhookEvent {
  code: number;
  shop_id: number;
  timestamp: number;
  data: any;
}

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

// Interfaces para sincronização
export interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  delayBetweenBatches?: number;
}

export interface SyncResult {
  success: boolean;
  processed: number;
  errors: string[];
  duration: number;
  lastSyncAt: Date;
}

// Interfaces para webhooks
export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  event?: ShopeeWebhookEvent;
}