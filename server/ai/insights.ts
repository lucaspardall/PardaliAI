
import { storage } from '../storage';

interface ProductInsight {
  productId: number;
  type: 'low_ctr' | 'high_performance' | 'optimization_opportunity' | 'trend_alert';
  severity: 'low' | 'medium' | 'high';
  message: string;
  actionSuggestion?: string;
  metrics?: {
    currentCtr?: number;
    targetCtr?: number;
    potentialImprovement?: number;
  };
}

interface StoreInsight {
  storeId: number;
  type: 'overall_performance' | 'top_products' | 'improvement_areas';
  message: string;
  actionSuggestion?: string;
  metrics?: Record<string, any>;
}

export class AIInsightsEngine {
  
  /**
   * Gera insights automáticos para produtos de uma loja
   */
  async generateProductInsights(storeId: number): Promise<ProductInsight[]> {
    const insights: ProductInsight[] = [];
    
    // Buscar produtos da loja
    const products = await storage.getProductsByStoreId(storeId);
    
    for (const product of products) {
      // Insight 1: CTR baixo
      if (product.ctr !== null && product.ctr < 1.5) {
        insights.push({
          productId: product.id,
          type: 'low_ctr',
          severity: product.ctr < 1.0 ? 'high' : 'medium',
          message: `O produto "${product.name}" tem CTR de ${product.ctr?.toFixed(2)}%, abaixo da média do mercado (2-3%).`,
          actionSuggestion: 'Considere otimizar o título e descrição com nossa IA.',
          metrics: {
            currentCtr: product.ctr,
            targetCtr: 2.5,
            potentialImprovement: ((2.5 - product.ctr) / product.ctr) * 100
          }
        });
      }
      
      // Insight 2: Alto desempenho
      if (product.ctr !== null && product.ctr > 4.0) {
        insights.push({
          productId: product.id,
          type: 'high_performance',
          severity: 'low',
          message: `Parabéns! O produto "${product.name}" tem excelente CTR de ${product.ctr?.toFixed(2)}%.`,
          actionSuggestion: 'Use este produto como modelo para otimizar outros similares.',
          metrics: {
            currentCtr: product.ctr
          }
        });
      }
      
      // Insight 3: Estoque baixo em produto popular
      if (product.stock !== null && product.stock < 5 && product.ctr && product.ctr > 2.0) {
        insights.push({
          productId: product.id,
          type: 'trend_alert',
          severity: 'high',
          message: `O produto "${product.name}" tem boa performance mas estoque baixo (${product.stock} unidades).`,
          actionSuggestion: 'Considere reabastecer rapidamente para não perder vendas.',
          metrics: {
            currentStock: product.stock,
            currentCtr: product.ctr
          }
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Gera insights gerais da loja
   */
  async generateStoreInsights(storeId: number): Promise<StoreInsight[]> {
    const insights: StoreInsight[] = [];
    const products = await storage.getProductsByStoreId(storeId);
    
    if (products.length === 0) {
      return [{
        storeId,
        type: 'improvement_areas',
        message: 'Sua loja ainda não possui produtos sincronizados.',
        actionSuggestion: 'Execute uma sincronização para começar a receber insights.'
      }];
    }
    
    // Calcular métricas gerais
    const productsWithCtr = products.filter(p => p.ctr !== null);
    const avgCtr = productsWithCtr.length > 0 
      ? productsWithCtr.reduce((sum, p) => sum + (p.ctr || 0), 0) / productsWithCtr.length 
      : 0;
    
    const lowPerformanceProducts = products.filter(p => p.ctr !== null && p.ctr < 1.5).length;
    const highPerformanceProducts = products.filter(p => p.ctr !== null && p.ctr > 3.0).length;
    
    // Insight de performance geral
    if (avgCtr > 0) {
      insights.push({
        storeId,
        type: 'overall_performance',
        message: `Sua loja tem CTR médio de ${avgCtr.toFixed(2)}%. ${
          avgCtr >= 2.5 ? 'Ótima performance!' : 
          avgCtr >= 1.5 ? 'Performance razoável, há espaço para melhorar.' :
          'Performance baixa, recomendamos otimizações.'
        }`,
        actionSuggestion: avgCtr < 2.5 ? 'Use nossa IA para otimizar produtos com baixo CTR.' : undefined,
        metrics: { avgCtr, totalProducts: products.length }
      });
    }
    
    // Insight sobre produtos que precisam de atenção
    if (lowPerformanceProducts > 0) {
      insights.push({
        storeId,
        type: 'improvement_areas',
        message: `${lowPerformanceProducts} produto(s) têm CTR abaixo de 1.5% e precisam de otimização.`,
        actionSuggestion: 'Priorize a otimização destes produtos para aumentar suas vendas.',
        metrics: { lowPerformanceCount: lowPerformanceProducts }
      });
    }
    
    // Insight sobre produtos de destaque
    if (highPerformanceProducts > 0) {
      insights.push({
        storeId,
        type: 'top_products',
        message: `${highPerformanceProducts} produto(s) têm excelente performance (CTR > 3%).`,
        actionSuggestion: 'Analise estes produtos para replicar o sucesso em outros itens.',
        metrics: { highPerformanceCount: highPerformanceProducts }
      });
    }
    
    return insights;
  }
  
  /**
   * Processa insights e cria notificações
   */
  async processInsightsForUser(userId: string, storeId: number): Promise<void> {
    try {
      const [productInsights, storeInsights] = await Promise.all([
        this.generateProductInsights(storeId),
        this.generateStoreInsights(storeId)
      ]);
      
      // Criar notificações para insights de alta prioridade
      for (const insight of productInsights.filter(i => i.severity === 'high')) {
        await storage.createNotification({
          userId,
          title: 'Alerta de Performance',
          message: insight.message + (insight.actionSuggestion ? ` ${insight.actionSuggestion}` : ''),
          type: 'warning',
          isRead: false,
          createdAt: new Date()
        });
      }
      
      // Criar notificações para insights da loja
      for (const insight of storeInsights.slice(0, 2)) { // Limitar a 2 insights por vez
        await storage.createNotification({
          userId,
          title: 'Insight da Loja',
          message: insight.message + (insight.actionSuggestion ? ` ${insight.actionSuggestion}` : ''),
          type: 'info',
          isRead: false,
          createdAt: new Date()
        });
      }
      
    } catch (error) {
      console.error('Error processing insights:', error);
    }
  }
}

export const aiInsights = new AIInsightsEngine();
