
/**
 * Módulo específico para operações com produtos da Shopee
 */
import { ShopeeClient } from './client';
import { ShopeeApiResponse } from './types';

/**
 * Interface para operações avançadas com produtos
 */
export class ShopeeProductManager {
  private client: ShopeeClient;

  constructor(client: ShopeeClient) {
    this.client = client;
  }

  /**
   * Busca produtos com filtros avançados
   */
  async getProductsWithFilters(filters: {
    status?: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST';
    categoryId?: number;
    hasModel?: boolean;
    offset?: number;
    pageSize?: number;
  }): Promise<ShopeeApiResponse> {
    const params: Record<string, any> = {
      offset: filters.offset || 0,
      page_size: filters.pageSize || 50
    };

    if (filters.status) {
      params.item_status = filters.status;
    }

    return this.client.get('/api/v2/product/get_item_list', params);
  }

  /**
   * Busca informações completas de um produto
   */
  async getProductFullInfo(itemId: number): Promise<{
    baseInfo: any;
    details: any;
    models: any;
    attributes: any;
  }> {
    try {
      const [baseInfo, details, models, attributes] = await Promise.all([
        this.client.get('/api/v2/product/get_item_base_info', {
          item_id_list: String(itemId)
        }),
        this.client.get('/api/v2/product/get_item_detail', {
          item_id_list: String(itemId)
        }),
        this.getProductModels(itemId),
        this.getProductAttributes(itemId)
      ]);

      return {
        baseInfo,
        details,
        models,
        attributes
      };
    } catch (error) {
      console.error(`Erro ao buscar informações completas do produto ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Busca modelos/variações de um produto
   */
  async getProductModels(itemId: number): Promise<ShopeeApiResponse> {
    return this.client.get('/api/v2/product/get_model_list', {
      item_id: itemId
    });
  }

  /**
   * Busca atributos de um produto
   */
  async getProductAttributes(itemId: number): Promise<ShopeeApiResponse> {
    return this.client.get('/api/v2/product/get_item_attribute', {
      item_id: itemId
    });
  }

  /**
   * Atualiza preço de um produto
   */
  async updateProductPrice(itemId: number, price: number): Promise<ShopeeApiResponse> {
    return this.client.post('/api/v2/product/update_price', {
      item_id: itemId,
      price_list: [{
        model_id: 0, // 0 para produto sem variações
        original_price: price
      }]
    });
  }

  /**
   * Atualiza estoque de um produto
   */
  async updateProductStock(itemId: number, stock: number): Promise<ShopeeApiResponse> {
    return this.client.post('/api/v2/product/update_stock', {
      item_id: itemId,
      stock_list: [{
        model_id: 0, // 0 para produto sem variações
        normal_stock: stock
      }]
    });
  }

  /**
   * Atualiza informações básicas de um produto
   */
  async updateProductInfo(itemId: number, updates: {
    name?: string;
    description?: string;
    weight?: number;
    condition?: 'NEW' | 'USED';
  }): Promise<ShopeeApiResponse> {
    const updateData: any = {
      item_id: itemId
    };

    if (updates.name) updateData.item_name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.weight) updateData.weight = updates.weight;
    if (updates.condition) updateData.condition = updates.condition;

    return this.client.post('/api/v2/product/update_item', updateData);
  }

  /**
   * Lista produtos com baixo estoque
   */
  async getLowStockProducts(threshold: number = 10): Promise<any[]> {
    const productList = await this.client.get('/api/v2/product/get_item_list', {
      page_size: 100
    });

    if (!productList?.item) return [];

    const itemIds = productList.item.map((item: any) => item.item_id);
    const details = await this.client.get('/api/v2/product/get_item_detail', {
      item_id_list: itemIds.join(',')
    });

    if (!details?.item_list) return [];

    return details.item_list.filter((item: any) => {
      const stock = item.stock_info?.current_stock || 0;
      return stock <= threshold;
    });
  }

  /**
   * Busca produtos mais vendidos
   */
  async getTopSellingProducts(days: number = 30): Promise<any[]> {
    // Este endpoint pode não estar disponível diretamente
    // Seria necessário implementar através de dados de pedidos
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (days * 24 * 60 * 60);

      // Buscar pedidos do período
      const orders = await this.client.get('/api/v2/order/get_order_list', {
        time_range_field: 'create_time',
        time_from: startTime,
        time_to: endTime,
        page_size: 100
      });

      // Processar dados para encontrar produtos mais vendidos
      // Esta é uma implementação simplificada
      return [];
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
      return [];
    }
  }

  /**
   * Calcula métricas de performance de produtos
   */
  async getProductMetrics(itemIds: number[]): Promise<{
    [itemId: number]: {
      views: number;
      sales: number;
      conversionRate: number;
      revenue: number;
    }
  }> {
    const metrics: any = {};

    for (const itemId of itemIds) {
      try {
        // Buscar dados de performance (se disponível na API)
        // Esta é uma implementação placeholder
        metrics[itemId] = {
          views: 0,
          sales: 0,
          conversionRate: 0,
          revenue: 0
        };
      } catch (error) {
        console.error(`Erro ao buscar métricas do produto ${itemId}:`, error);
        metrics[itemId] = {
          views: 0,
          sales: 0,
          conversionRate: 0,
          revenue: 0
        };
      }
    }

    return metrics;
  }

  /**
   * Busca categorias disponíveis
   */
  async getCategories(): Promise<ShopeeApiResponse> {
    return this.client.get('/api/v2/product/get_category');
  }

  /**
   * Busca atributos de uma categoria
   */
  async getCategoryAttributes(categoryId: number): Promise<ShopeeApiResponse> {
    return this.client.get('/api/v2/product/get_attributes', {
      category_id: categoryId
    });
  }

  /**
   * Valida um produto antes de criar/atualizar
   */
  validateProduct(productData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!productData.item_name || productData.item_name.trim().length === 0) {
      errors.push('Nome do produto é obrigatório');
    }

    if (productData.item_name && productData.item_name.length > 120) {
      errors.push('Nome do produto deve ter no máximo 120 caracteres');
    }

    if (!productData.category_id) {
      errors.push('Categoria é obrigatória');
    }

    if (!productData.original_price || productData.original_price <= 0) {
      errors.push('Preço deve ser maior que zero');
    }

    if (!productData.normal_stock || productData.normal_stock < 0) {
      errors.push('Estoque deve ser maior ou igual a zero');
    }

    if (!productData.images || productData.images.length === 0) {
      errors.push('Pelo menos uma imagem é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
