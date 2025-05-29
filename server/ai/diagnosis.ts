
import { storage } from '../storage';
import type { CategoryScores, TacticalRecommendation, BenchmarkData } from '../../shared/schema';

export class StoreDiagnosisEngine {
  
  /**
   * Gera diagnóstico completo da loja
   */
  async generateCompleteDiagnosis(storeId: number): Promise<{
    overallScore: number;
    categoryScores: CategoryScores;
    strengths: string[];
    weaknesses: string[];
    recommendations: TacticalRecommendation[];
    benchmarkData: BenchmarkData;
    metricsUsed: Record<string, any>;
  }> {
    
    // 1. Coletar dados da loja
    const store = await storage.getStoreById(storeId);
    if (!store) throw new Error('Store not found');
    
    const products = await storage.getProductsByStoreId(storeId);
    const metrics = await storage.getStoreMetrics(storeId, 30);
    
    // 2. Calcular scores por categoria
    const categoryScores = await this.calculateCategoryScores(store, products, metrics);
    
    // 3. Calcular score geral (média ponderada)
    const overallScore = this.calculateOverallScore(categoryScores);
    
    // 4. Identificar pontos fortes e fracos
    const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses(categoryScores, store, products);
    
    // 5. Gerar recomendações táticas
    const recommendations = this.generateTacticalRecommendations(categoryScores, weaknesses, products);
    
    // 6. Gerar dados de benchmark
    const benchmarkData = this.generateBenchmarkData(categoryScores);
    
    // 7. Compilar métricas utilizadas
    const metricsUsed = this.compileMetricsUsed(store, products, metrics);
    
    return {
      overallScore,
      categoryScores,
      strengths,
      weaknesses,
      recommendations,
      benchmarkData,
      metricsUsed
    };
  }
  
  /**
   * Calcula scores por categoria (0-10)
   */
  private async calculateCategoryScores(store: any, products: any[], metrics: any[]): Promise<CategoryScores> {
    const activeProducts = products.filter(p => p.status === 'active');
    const productsWithCtr = products.filter(p => p.ctr !== null && p.ctr > 0);
    
    // CTR Score (0-10 baseado em 0-5% CTR)
    const avgCtr = productsWithCtr.length > 0 
      ? productsWithCtr.reduce((sum, p) => sum + (p.ctr || 0), 0) / productsWithCtr.length 
      : 0;
    const ctrScore = Math.min(10, (avgCtr / 5) * 10);
    
    // Inventory Score (0-10 baseado em % produtos com estoque adequado)
    const productsWithStock = activeProducts.filter(p => p.stock && p.stock > 5).length;
    const inventoryScore = activeProducts.length > 0 ? (productsWithStock / activeProducts.length) * 10 : 0;
    
    // Sales Score (0-10 baseado em revenue e crescimento)
    const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const avgProductRevenue = products.length > 0 ? totalRevenue / products.length : 0;
    const salesScore = Math.min(10, (avgProductRevenue / 1000) * 10); // Normalizado para R$ 1000
    
    // Optimization Score (0-10 baseado em produtos otimizados)
    const optimizations = await storage.getAllOptimizationsByUserId(store.userId);
    const optimizedProducts = new Set(optimizations.map(o => o.productId)).size;
    const optimizationScore = activeProducts.length > 0 ? Math.min(10, (optimizedProducts / activeProducts.length) * 10) : 0;
    
    // Engagement Score (0-10 baseado em views, likes)
    const avgViews = products.length > 0 ? products.reduce((sum, p) => sum + (p.views || 0), 0) / products.length : 0;
    const engagementScore = Math.min(10, (avgViews / 1000) * 10); // Normalizado para 1000 views
    
    return {
      ctr: Math.round(ctrScore * 10) / 10,
      inventory: Math.round(inventoryScore * 10) / 10,
      sales: Math.round(salesScore * 10) / 10,
      optimization: Math.round(optimizationScore * 10) / 10,
      engagement: Math.round(engagementScore * 10) / 10
    };
  }
  
  /**
   * Calcula score geral ponderado
   */
  private calculateOverallScore(categoryScores: CategoryScores): number {
    const weights = {
      ctr: 0.25,        // 25% - CTR é fundamental
      inventory: 0.15,  // 15% - Gestão de estoque
      sales: 0.25,      // 25% - Performance de vendas
      optimization: 0.20, // 20% - Otimizações aplicadas
      engagement: 0.15  // 15% - Engajamento
    };
    
    const weightedScore = 
      (categoryScores.ctr * weights.ctr) +
      (categoryScores.inventory * weights.inventory) +
      (categoryScores.sales * weights.sales) +
      (categoryScores.optimization * weights.optimization) +
      (categoryScores.engagement * weights.engagement);
    
    return Math.round(weightedScore * 10) / 10;
  }
  
  /**
   * Identifica pontos fortes e fracos
   */
  private identifyStrengthsAndWeaknesses(categoryScores: CategoryScores, store: any, products: any[]): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Analisar cada categoria
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 8.0) {
        strengths.push(this.getStrengthMessage(category, score));
      } else if (score <= 4.0) {
        weaknesses.push(this.getWeaknessMessage(category, score));
      }
    });
    
    // Adicionar insights específicos
    if (products.length === 0) {
      weaknesses.push('Nenhum produto sincronizado na loja');
    }
    
    if (store.followerCount && store.followerCount > 1000) {
      strengths.push(`Base sólida de ${store.followerCount.toLocaleString()} seguidores`);
    }
    
    return { strengths, weaknesses };
  }
  
  /**
   * Gera recomendações táticas específicas
   */
  private generateTacticalRecommendations(categoryScores: CategoryScores, weaknesses: string[], products: any[]): TacticalRecommendation[] {
    const recommendations: TacticalRecommendation[] = [];
    
    // Recomendação para CTR baixo
    if (categoryScores.ctr < 6.0) {
      recommendations.push({
        id: 'improve-ctr',
        category: 'Performance',
        priority: 'high',
        title: 'Otimizar títulos e descrições dos produtos',
        description: 'Seu CTR médio está abaixo do ideal. Produtos bem otimizados têm CTR 2-3x maior.',
        actionSteps: [
          'Use nossa IA para otimizar títulos dos produtos com CTR < 2%',
          'Adicione palavras-chave relevantes nas descrições',
          'Teste diferentes combinações de título',
          'Monitore o desempenho por 7-14 dias'
        ],
        expectedImpact: 'Aumento de 50-150% no CTR dos produtos otimizados',
        estimatedTime: '2-3 horas para otimizar 10 produtos'
      });
    }
    
    // Recomendação para estoque
    if (categoryScores.inventory < 6.0) {
      recommendations.push({
        id: 'manage-inventory',
        category: 'Operações',
        priority: 'medium',
        title: 'Melhorar gestão de estoque',
        description: 'Muitos produtos estão com estoque baixo ou zerado, perdendo vendas potenciais.',
        actionSteps: [
          'Identifique produtos com melhor CTR e baixo estoque',
          'Priorize reabastecimento destes produtos',
          'Configure alertas de estoque baixo',
          'Analise histórico de vendas para previsão'
        ],
        expectedImpact: 'Redução de 30% em vendas perdidas por falta de estoque',
        estimatedTime: '1-2 horas semanais de monitoramento'
      });
    }
    
    // Recomendação para vendas
    if (categoryScores.sales < 6.0) {
      recommendations.push({
        id: 'boost-sales',
        category: 'Estratégia',
        priority: 'high',
        title: 'Estratégias para aumentar vendas',
        description: 'Suas vendas estão abaixo do potencial. Vamos focar nos produtos mais promissores.',
        actionSteps: [
          'Identifique seus top 3 produtos por CTR',
          'Otimize preços baseado na concorrência',
          'Crie promoções estratégicas',
          'Melhore fotos e descrições dos produtos principais'
        ],
        expectedImpact: 'Aumento de 25-40% nas vendas em 30 dias',
        estimatedTime: '4-6 horas de trabalho estratégico'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Gera dados de benchmark da indústria
   */
  private generateBenchmarkData(categoryScores: CategoryScores): BenchmarkData {
    // Benchmarks baseados em dados da indústria e-commerce
    const industryAverage: CategoryScores = {
      ctr: 2.5,
      inventory: 7.0,
      sales: 6.0,
      optimization: 4.0,
      engagement: 5.5
    };
    
    const topPerformers: CategoryScores = {
      ctr: 4.5,
      inventory: 9.0,
      sales: 8.5,
      optimization: 8.0,
      engagement: 8.0
    };
    
    // Calcular posição geral
    const overallScore = this.calculateOverallScore(categoryScores);
    const industryOverall = this.calculateOverallScore(industryAverage);
    
    let rank: string;
    let percentile: number;
    
    if (overallScore >= 8.0) {
      rank = 'excellent';
      percentile = 90;
    } else if (overallScore >= 6.5) {
      rank = 'good';
      percentile = 75;
    } else if (overallScore >= 5.0) {
      rank = 'average';
      percentile = 50;
    } else if (overallScore >= 3.5) {
      rank = 'below_average';
      percentile = 25;
    } else {
      rank = 'poor';
      percentile = 10;
    }
    
    return {
      industryAverage,
      topPerformers,
      yourPosition: { percentile, rank }
    };
  }
  
  /**
   * Compila métricas utilizadas no diagnóstico
   */
  private compileMetricsUsed(store: any, products: any[], metrics: any[]): Record<string, any> {
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      avgCtr: products.length > 0 ? products.reduce((sum, p) => sum + (p.ctr || 0), 0) / products.length : 0,
      totalRevenue: products.reduce((sum, p) => sum + (p.revenue || 0), 0),
      storeRating: store.rating,
      followerCount: store.followerCount,
      lastSyncAt: store.lastSyncAt,
      metricsCount: metrics.length,
      analysisDate: new Date().toISOString()
    };
  }
  
  private getStrengthMessage(category: string, score: number): string {
    const messages = {
      ctr: `Excelente CTR (${score.toFixed(1)}/10) - seus produtos atraem muitos cliques`,
      inventory: `Gestão de estoque eficiente (${score.toFixed(1)}/10) - boa disponibilidade`,
      sales: `Performance de vendas destacada (${score.toFixed(1)}/10) - revenue consistente`,
      optimization: `Produtos bem otimizados (${score.toFixed(1)}/10) - estratégia eficaz`,
      engagement: `Alto engajamento (${score.toFixed(1)}/10) - produtos atrativos aos clientes`
    };
    
    return messages[category as keyof typeof messages] || `${category}: ${score.toFixed(1)}/10`;
  }
  
  private getWeaknessMessage(category: string, score: number): string {
    const messages = {
      ctr: `CTR baixo (${score.toFixed(1)}/10) - produtos precisam de otimização`,
      inventory: `Gestão de estoque deficiente (${score.toFixed(1)}/10) - muitos produtos em falta`,
      sales: `Vendas abaixo do potencial (${score.toFixed(1)}/10) - revisar estratégia`,
      optimization: `Poucos produtos otimizados (${score.toFixed(1)}/10) - oportunidade de melhoria`,
      engagement: `Baixo engajamento (${score.toFixed(1)}/10) - produtos pouco atrativos`
    };
    
    return messages[category as keyof typeof messages] || `${category}: ${score.toFixed(1)}/10`;
  }
}

export const diagnosisEngine = new StoreDiagnosisEngine();
