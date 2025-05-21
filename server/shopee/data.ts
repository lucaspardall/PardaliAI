
/**
 * Funções para buscar dados da loja através da API da Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeApiResponse } from './types';

/**
 * Busca informações básicas da loja
 */
export async function getShopInfo(client: ShopeeClient): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/shop/get_shop_info');
}

/**
 * Busca o perfil detalhado da loja
 */
export async function getShopProfile(client: ShopeeClient): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/shop/get_profile');
}

/**
 * Busca métricas de desempenho da loja
 */
export async function getShopPerformance(client: ShopeeClient): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/shop/get_shop_performance');
}

/**
 * Lista produtos da loja (paginados)
 * @param client Cliente Shopee autenticado
 * @param offset Posição inicial (para paginação)
 * @param pageSize Quantidade de itens por página
 * @param itemStatus Status dos produtos (opcional)
 */
export async function getProductList(
  client: ShopeeClient, 
  offset = 0, 
  pageSize = 50,
  itemStatus?: string
): Promise<ShopeeApiResponse> {
  const params: Record<string, any> = {
    offset,
    page_size: pageSize
  };
  
  if (itemStatus) {
    params.item_status = itemStatus;
  }
  
  return client.get('/api/v2/product/get_item_list', params);
}

/**
 * Busca informações básicas de produtos específicos
 * @param client Cliente Shopee autenticado
 * @param itemIds Array de IDs dos produtos
 */
export async function getProductsBaseInfo(
  client: ShopeeClient,
  itemIds: number[]
): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/product/get_item_base_info', {
    item_id_list: itemIds.join(',')
  });
}

/**
 * Busca informações detalhadas de produtos específicos
 * @param client Cliente Shopee autenticado
 * @param itemIds Array de IDs dos produtos
 */
export async function getProductDetails(
  client: ShopeeClient,
  itemIds: number[]
): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/product/get_item_detail', {
    item_id_list: itemIds.join(',')
  });
}

/**
 * Lista pedidos da loja (paginados)
 * @param client Cliente Shopee autenticado
 * @param timeRangeField Campo a ser usado para filtro de data
 * @param timeFrom Timestamp inicial
 * @param timeTo Timestamp final
 * @param pageSize Quantidade de pedidos por página
 * @param cursor Cursor para paginação
 * @param orderStatus Status dos pedidos (opcional)
 */
export async function getOrderList(
  client: ShopeeClient,
  timeRangeField: 'create_time' | 'update_time',
  timeFrom: number,
  timeTo: number,
  pageSize = 50,
  cursor?: string,
  orderStatus?: string
): Promise<ShopeeApiResponse> {
  const params: Record<string, any> = {
    time_range_field: timeRangeField,
    time_from: timeFrom,
    time_to: timeTo,
    page_size: pageSize
  };
  
  if (cursor) {
    params.cursor = cursor;
  }
  
  if (orderStatus) {
    params.order_status = orderStatus;
  }
  
  return client.get('/api/v2/order/get_order_list', params);
}

/**
 * Busca detalhes de pedidos específicos
 * @param client Cliente Shopee autenticado
 * @param orderSns Array de números de pedidos
 */
export async function getOrderDetails(
  client: ShopeeClient,
  orderSns: string[]
): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/order/get_order_detail', {
    order_sn_list: orderSns.join(',')
  });
}

/**
 * Busca histórico de transações financeiras da loja
 * @param client Cliente Shopee autenticado
 * @param walletType Tipo de carteira (0: Shopee Wallet, 1: Seller Balance)
 * @param createTimeFrom Timestamp inicial
 * @param createTimeTo Timestamp final
 * @param pageSize Quantidade de transações por página
 * @param pageNo Número da página
 */
export async function getWalletTransactions(
  client: ShopeeClient,
  walletType: 0 | 1,
  createTimeFrom: number,
  createTimeTo: number,
  pageSize = 50,
  pageNo = 1
): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/finance/get_wallet_transactions', {
    wallet_type: walletType,
    create_time_from: createTimeFrom,
    create_time_to: createTimeTo,
    page_size: pageSize,
    page_no: pageNo
  });
}

/**
 * Busca métodos de envio disponíveis para a loja
 */
export async function getLogisticChannels(
  client: ShopeeClient
): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/logistics/get_channel_list');
}

/**
 * Busca categorias disponíveis para a loja
 */
export async function getCategories(
  client: ShopeeClient
): Promise<ShopeeApiResponse> {
  return client.get('/api/v2/product/get_category');
}
