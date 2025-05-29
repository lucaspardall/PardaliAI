
import { storage } from '../storage';
import { queueManager } from './queue-manager';
import { openaiClient } from './openai-client';
import type { Product, InsertProductOptimization, AiRequest, InsertAiRequest } from '@shared/schema';

export interface AICreditsManager {
  validateCredits(userId: string, operation: string): Promise<boolean>;
  deductCredits(userId: string, operation: string, details?: any): Promise<void>;
  reserveCredits(userId: string, amount: number): Promise<void>;
  commitCredits(userId: string, amount: number, action: string, operation: string): Promise<void>;
  rollbackCredits(userId: string, amount: number): Promise<void>;
}

export class AIService {
  private readonly CREDIT_COSTS = {
    'product_optimization': 1,
    'ad_creation': 2,
    'store_analysis': 5,
    'campaign_analysis': 3
  };

  private readonly PRIORITY_MAPPING = {
    'urgent': 'urgent',    // Processamento imediato (planos premium)
    'high': 'high',        // < 30 segundos
    'normal': 'medium',    // < 2 minutos (padrão)
    'low': 'low'          // < 5 minutos (plano free)
  };

  /**
   * Otimizar produto com OpenAI Assistant
   */
  async optimizeProduct(
    userId: string,
    product: Product,
    priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ optimization: InsertProductOptimization; requestId: string }> {
    
    // 1. Validar créditos
    await this.validateCredits(userId, 'product_optimization');

    // 2. Criar registro de request
    const request = await storage.createAiRequest({
      userId,
      type: 'product_optimization',
      input: {
        productId: product.id,
        productName: product.name,
        productDescription: product.description,
        category: product.category,
        currentPrice: product.price,
        currentStock: product.stock,
        metrics: {
          ctr: product.ctr,
          views: product.views,
          sales: product.sales,
          revenue: product.revenue
        }
      },
      status: 'queued'
    });

    // 3. Adicionar à fila
    const queuePriority = this.PRIORITY_MAPPING[priority];
    const queueId = await queueManager.enqueue(
      userId,
      'product_optimization',
      {
        requestId: request.id,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          stock: product.stock,
          ctr: product.ctr,
          views: product.views,
          sales: product.sales
        }
      },
      queuePriority
    );

    // 4. Configurar listener para resultado
    this.setupResultListener(request.id, userId, 'product_optimization');

    // 5. Criar registro de otimização pendente
    const optimization: InsertProductOptimization = {
      productId: product.id,
      originalTitle: product.name,
      originalDesc: product.description || '',
      originalKeywords: '',
      suggestedTitle: '',
      suggestedDesc: '',
      suggestedKeywords: '',
      reasoningNotes: 'Processando com IA...',
      status: 'processing',
      aiRequestId: request.id
    };

    return { optimization, requestId: request.id };
  }

  /**
   * Criar anúncio com IA
   */
  async createAd(
    userId: string,
    productData: any,
    adType: 'search' | 'display' | 'video' = 'search',
    priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ requestId: string }> {
    
    await this.validateCredits(userId, 'ad_creation');

    const request = await storage.createAiRequest({
      userId,
      type: 'ad_creation',
      input: {
        productData,
        adType,
        createdAt: new Date()
      },
      status: 'queued'
    });

    const queuePriority = this.PRIORITY_MAPPING[priority];
    await queueManager.enqueue(
      userId,
      'ad_creation',
      {
        requestId: request.id,
        productData,
        adType
      },
      queuePriority
    );

    this.setupResultListener(request.id, userId, 'ad_creation');

    return { requestId: request.id };
  }

  /**
   * Analisar loja com IA
   */
  async analyzeStore(
    userId: string,
    storeId: number,
    priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ requestId: string }> {
    
    await this.validateCredits(userId, 'store_analysis');

    // Coletar dados da loja
    const store = await storage.getStoreById(storeId);
    const products = await storage.getProductsByStoreId(storeId);
    const metrics = await storage.getStoreMetrics(storeId, 30);

    const request = await storage.createAiRequest({
      userId,
      type: 'store_analysis',
      input: {
        storeId,
        storeData: store,
        products: products.slice(0, 50), // Limitar para não exceder limite da API
        metrics,
        analysisDate: new Date()
      },
      status: 'queued'
    });

    const queuePriority = this.PRIORITY_MAPPING[priority];
    await queueManager.enqueue(
      userId,
      'store_analysis',
      {
        requestId: request.id,
        storeData: {
          ...store,
          totalProducts: products.length,
          avgCtr: products.length > 0 ? products.reduce((sum, p) => sum + (p.ctr || 0), 0) / products.length : 0,
          totalRevenue: products.reduce((sum, p) => sum + (p.revenue || 0), 0)
        },
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          ctr: p.ctr,
          views: p.views,
          sales: p.sales,
          revenue: p.revenue,
          stock: p.stock
        })),
        metrics
      },
      queuePriority
    );

    this.setupResultListener(request.id, userId, 'store_analysis');

    return { requestId: request.id };
  }

  /**
   * Analisar campanha com IA
   */
  async analyzeCampaign(
    userId: string,
    campaignData: any,
    priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ requestId: string }> {
    
    await this.validateCredits(userId, 'campaign_analysis');

    const request = await storage.createAiRequest({
      userId,
      type: 'campaign_analysis',
      input: {
        campaignData,
        analysisDate: new Date()
      },
      status: 'queued'
    });

    const queuePriority = this.PRIORITY_MAPPING[priority];
    await queueManager.enqueue(
      userId,
      'campaign_analysis',
      {
        requestId: request.id,
        campaignData
      },
      queuePriority
    );

    this.setupResultListener(request.id, userId, 'campaign_analysis');

    return { requestId: request.id };
  }

  /**
   * Validar créditos antes da operação
   */
  private async validateCredits(userId: string, operation: keyof typeof this.CREDIT_COSTS): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const cost = this.CREDIT_COSTS[operation];
    
    if (user.plan === 'free' && user.aiCreditsLeft < cost) {
      throw new Error(`Insufficient credits. Need ${cost}, have ${user.aiCreditsLeft}`);
    }
  }

  /**
   * Deduzir créditos após operação bem-sucedida
   */
  private async deductCredits(userId: string, operation: keyof typeof this.CREDIT_COSTS, details?: any): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    if (user.plan === 'free') {
      const cost = this.CREDIT_COSTS[operation];
      const newBalance = Math.max(0, user.aiCreditsLeft - cost);
      
      await storage.updateUserAiCredits(
        userId,
        newBalance,
        'used',
        `${operation}: ${details?.description || 'IA processing'}`,
        details?.relatedEntity
      );
    }
  }

  /**
   * Configurar listener para resultado do processamento
   */
  private setupResultListener(requestId: string, userId: string, operationType: string): void {
    const handleResult = async (event: any) => {
      if (event.itemId.includes(`_${requestId}_`)) {
        try {
          if (event.result.success) {
            // Atualizar request com resultado
            await storage.updateAiRequest(requestId, {
              status: 'completed',
              output: event.result.data,
              processingTime: event.result.processingTime,
              completedAt: new Date()
            });

            // Deduzir créditos
            await this.deductCredits(userId, operationType as any, {
              description: `Request ${requestId}`,
              relatedEntity: { type: 'ai_request', id: requestId }
            });

            // Processar resultado específico por tipo
            await this.processResult(requestId, operationType, event.result.data);

          } else {
            // Marcar como falhou
            await storage.updateAiRequest(requestId, {
              status: 'failed',
              errorMessage: event.result.error,
              completedAt: new Date()
            });
          }
        } catch (error) {
          console.error(`Error handling result for request ${requestId}:`, error);
        } finally {
          // Remover listener
          queueManager.off('item_processed', handleResult);
        }
      }
    };

    queueManager.on('item_processed', handleResult);
  }

  /**
   * Processar resultado específico por tipo
   */
  private async processResult(requestId: string, operationType: string, data: any): Promise<void> {
    try {
      const request = await storage.getAiRequestById(requestId);
      if (!request) return;

      switch (operationType) {
        case 'product_optimization':
          await this.processOptimizationResult(request, data);
          break;
        case 'store_analysis':
          await this.processStoreAnalysisResult(request, data);
          break;
        // Adicionar outros tipos conforme necessário
      }
    } catch (error) {
      console.error(`Error processing result for ${operationType}:`, error);
    }
  }

  /**
   * Processar resultado de otimização de produto
   */
  private async processOptimizationResult(request: any, data: any): Promise<void> {
    const inputData = request.input;
    
    // Criar ou atualizar otimização
    const optimization: InsertProductOptimization = {
      productId: inputData.productId,
      originalTitle: inputData.productName,
      originalDesc: inputData.productDescription || '',
      originalKeywords: '',
      suggestedTitle: data.optimized_title || data.title || inputData.productName,
      suggestedDesc: data.optimized_description || data.description || '',
      suggestedKeywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords || '',
      reasoningNotes: data.reasoning || data.explanation || 'Otimização realizada por IA',
      status: 'pending',
      aiRequestId: request.id
    };

    await storage.createOptimization(optimization);

    // Criar notificação
    await storage.createNotification({
      userId: request.userId,
      title: 'Otimização concluída',
      message: `A otimização do produto "${inputData.productName}" foi concluída com sucesso.`,
      type: 'success'
    });
  }

  /**
   * Processar resultado de análise de loja
   */
  private async processStoreAnalysisResult(request: any, data: any): Promise<void> {
    // Salvar diagnóstico (se existir tabela)
    // await storage.createStoreDiagnosis({...});

    // Criar notificação
    await storage.createNotification({
      userId: request.userId,
      title: 'Análise da loja concluída',
      message: `A análise completa da sua loja foi finalizada. Score geral: ${data.overall_score || 'N/A'}`,
      type: 'info'
    });
  }

  /**
   * Obter status da fila para o usuário
   */
  async getQueueStatus(userId: string): Promise<any> {
    const userRequests = await storage.getAiRequestsByUserId(userId);
    const pendingRequests = userRequests.filter(r => ['queued', 'processing'].includes(r.status));

    const queueStatus = queueManager.getQueueStatus();
    
    return {
      ...queueStatus,
      userPendingRequests: pendingRequests.length,
      userRequests: pendingRequests.map(req => ({
        id: req.id,
        type: req.type,
        status: req.status,
        createdAt: req.createdAt,
        position: queueManager.getQueuePosition(`${req.type}_${req.userId}_${req.id}`)
      }))
    };
  }
}

export const aiService = new AIService();
