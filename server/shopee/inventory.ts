
/**
 * Gerenciamento de estoque e preços para produtos da Shopee
 */
import { ShopeeUpdateManager } from './update';
import { ShopeeClient } from './client';

interface InventoryRule {
  id: string;
  name: string;
  condition: 'low_stock' | 'out_of_stock' | 'price_change' | 'competitor_price';
  threshold?: number;
  action: 'notify' | 'update_price' | 'update_stock' | 'deactivate';
  actionValue?: number;
  isActive: boolean;
}

interface PriceOptimization {
  productId: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  estimatedImpact: {
    salesIncrease?: number;
    profitChange?: number;
  };
}

/**
 * Gerenciador de inventário e preços
 */
export class InventoryManager {
  private client: ShopeeClient;
  private updateManager: ShopeeUpdateManager;
  private storeId: number;

  constructor(client: ShopeeClient, storeId: number) {
    this.client = client;
    this.updateManager = new ShopeeUpdateManager(client, storeId);
    this.storeId = storeId;
  }

  /**
   * Monitora estoque baixo e executa ações automáticas
   */
  async monitorLowStock(rules: InventoryRule[]): Promise<{
    triggered: number;
    actions: Array<{
      productId: string;
      action: string;
      result: 'success' | 'failed';
      message: string;
    }>;
  }> {
    const { storage } = await import('../storage');
    const products = await storage.getProductsByStoreId(this.storeId);
    
    let triggered = 0;
    const actions: Array<{
      productId: string;
      action: string;
      result: 'success' | 'failed';
      message: string;
    }> = [];

    console.log(`[Inventory] Monitorando estoque para ${products.length} produtos`);

    for (const product of products) {
      for (const rule of rules.filter(r => r.isActive)) {
        let shouldTrigger = false;

        // Verificar condições da regra
        switch (rule.condition) {
          case 'low_stock':
            shouldTrigger = product.stock <= (rule.threshold || 5);
            break;
          case 'out_of_stock':
            shouldTrigger = product.stock === 0;
            break;
        }

        if (shouldTrigger) {
          triggered++;
          
          try {
            const result = await this.executeInventoryAction(product, rule);
            actions.push({
              productId: product.productId,
              action: rule.action,
              result: 'success',
              message: result
            });
          } catch (error) {
            actions.push({
              productId: product.productId,
              action: rule.action,
              result: 'failed',
              message: error.message
            });
          }
        }
      }
    }

    return { triggered, actions };
  }

  /**
   * Executa ação de inventário baseada na regra
   */
  private async executeInventoryAction(product: any, rule: InventoryRule): Promise<string> {
    const { storage } = await import('../storage');

    switch (rule.action) {
      case 'notify':
        // Criar notificação
        const store = await storage.getStoreById(this.storeId);
        await storage.createNotification({
          userId: store.userId,
          title: `Estoque baixo: ${product.name}`,
          message: `O produto ${product.name} está com estoque baixo (${product.stock} unidades)`,
          type: 'warning',
          isRead: false,
          createdAt: new Date()
        });
        return 'Notificação criada';

      case 'update_stock':
        if (rule.actionValue) {
          await this.updateManager.updateProductStock(
            parseInt(product.productId), 
            rule.actionValue
          );
          
          // Atualizar no banco local
          await storage.updateProduct(product.id, {
            stock: rule.actionValue,
            updatedAt: new Date()
          });
          
          return `Estoque atualizado para ${rule.actionValue}`;
        }
        throw new Error('Valor de ação não definido para atualização de estoque');

      case 'deactivate':
        await this.updateManager.updateProductInfo(
          parseInt(product.productId), 
          { status: 'UNLIST' }
        );
        
        // Atualizar no banco local
        await storage.updateProduct(product.id, {
          status: 'inactive',
          updatedAt: new Date()
        });
        
        return 'Produto desativado';

      default:
        throw new Error(`Ação não suportada: ${rule.action}`);
    }
  }

  /**
   * Analisa e sugere otimizações de preço
   */
  async analyzePriceOptimization(): Promise<PriceOptimization[]> {
    const { storage } = await import('../storage');
    const products = await storage.getProductsByStoreId(this.storeId);
    const optimizations: PriceOptimization[] = [];

    console.log(`[Inventory] Analisando otimização de preços para ${products.length} produtos`);

    for (const product of products) {
      // Análise básica de preço (pode ser expandida com IA)
      const optimization = await this.analyzeProductPrice(product);
      if (optimization) {
        optimizations.push(optimization);
      }
    }

    return optimizations;
  }

  /**
   * Analisa preço de um produto específico
   */
  private async analyzeProductPrice(product: any): Promise<PriceOptimization | null> {
    // Análise simples baseada em margem e estoque
    const currentPrice = product.price;
    
    // Se o estoque está alto e o preço não mudou há muito tempo, sugerir redução
    if (product.stock > 50 && !product.lastPriceUpdate) {
      const suggestedPrice = currentPrice * 0.95; // 5% de desconto
      
      return {
        productId: product.productId,
        currentPrice,
        suggestedPrice,
        reason: 'Alto estoque - sugerir promoção para acelerar vendas',
        estimatedImpact: {
          salesIncrease: 15,
          profitChange: -5
        }
      };
    }

    // Se o estoque está baixo, sugerir aumento de preço
    if (product.stock < 5 && product.stock > 0) {
      const suggestedPrice = currentPrice * 1.1; // 10% de aumento
      
      return {
        productId: product.productId,
        currentPrice,
        suggestedPrice,
        reason: 'Estoque baixo - maximizar margem antes do reabastecimento',
        estimatedImpact: {
          salesIncrease: -10,
          profitChange: 20
        }
      };
    }

    return null;
  }

  /**
   * Aplica otimizações de preço automaticamente
   */
  async applyPriceOptimizations(optimizations: PriceOptimization[]): Promise<{
    applied: number;
    failed: number;
    errors: string[];
  }> {
    const { storage } = await import('../storage');
    let applied = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(`[Inventory] Aplicando ${optimizations.length} otimizações de preço`);

    for (const optimization of optimizations) {
      try {
        // Atualizar preço na Shopee
        await this.updateManager.updateProductPrice(
          parseInt(optimization.productId),
          optimization.suggestedPrice
        );

        // Atualizar no banco local
        const product = await storage.getProductByStoreIdAndProductId(
          this.storeId, 
          optimization.productId
        );

        if (product) {
          await storage.updateProduct(product.id, {
            price: optimization.suggestedPrice,
            lastPriceUpdate: new Date(),
            updatedAt: new Date()
          });
        }

        applied++;
        console.log(`[Inventory] Preço do produto ${optimization.productId} atualizado para ${optimization.suggestedPrice}`);

      } catch (error) {
        failed++;
        const errorMsg = `Erro ao atualizar preço do produto ${optimization.productId}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { applied, failed, errors };
  }

  /**
   * Relatório de inventário
   */
  async generateInventoryReport(): Promise<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averageStock: number;
    totalValue: number;
    topProducts: Array<{
      name: string;
      stock: number;
      value: number;
    }>;
  }> {
    const { storage } = await import('../storage');
    const products = await storage.getProductsByStoreId(this.storeId);

    const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const averageStock = products.reduce((sum, p) => sum + p.stock, 0) / products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    const topProducts = products
      .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        stock: p.stock,
        value: p.price * p.stock
      }));

    return {
      totalProducts: products.length,
      lowStockProducts,
      outOfStockProducts,
      averageStock,
      totalValue,
      topProducts
    };
  }
}

/**
 * Função utilitária para gerenciar inventário de uma loja
 */
export async function manageStoreInventory(storeId: number): Promise<{
  monitoringResult: any;
  optimizations: PriceOptimization[];
  report: any;
}> {
  try {
    const { storage } = await import('../storage');
    const store = await storage.getStoreById(storeId);
    
    if (!store || !store.isActive) {
      throw new Error('Loja não encontrada ou inativa');
    }

    // Carregar cliente Shopee
    const { loadShopeeClientForStore } = await import('./index');
    const client = await loadShopeeClientForStore(store.shopId);

    if (!client) {
      throw new Error('Não foi possível carregar cliente Shopee para a loja');
    }

    const inventoryManager = new InventoryManager(client, storeId);

    // Regras básicas de inventário
    const defaultRules: InventoryRule[] = [
      {
        id: 'low_stock_notify',
        name: 'Notificar estoque baixo',
        condition: 'low_stock',
        threshold: 5,
        action: 'notify',
        isActive: true
      },
      {
        id: 'out_of_stock_deactivate',
        name: 'Desativar produto sem estoque',
        condition: 'out_of_stock',
        action: 'deactivate',
        isActive: true
      }
    ];

    // Executar monitoramento
    const monitoringResult = await inventoryManager.monitorLowStock(defaultRules);
    
    // Analisar otimizações
    const optimizations = await inventoryManager.analyzePriceOptimization();
    
    // Gerar relatório
    const report = await inventoryManager.generateInventoryReport();

    return {
      monitoringResult,
      optimizations,
      report
    };

  } catch (error) {
    throw new Error(`Erro no gerenciamento de inventário: ${error.message}`);
  }
}
