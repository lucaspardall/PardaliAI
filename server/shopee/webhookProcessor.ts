
/**
 * Processador de webhooks em background para a Shopee
 */
import { storage } from '../storage';
import { syncStore } from './sync';

interface WebhookJob {
  id: string;
  event: any;
  retries: number;
  createdAt: Date;
  processAt: Date;
}

class WebhookProcessor {
  private jobs: Map<string, WebhookJob> = new Map();
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 segundos

  /**
   * Adiciona um job de webhook para processamento
   */
  addJob(event: any): string {
    const jobId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: WebhookJob = {
      id: jobId,
      event,
      retries: 0,
      createdAt: new Date(),
      processAt: new Date()
    };

    this.jobs.set(jobId, job);
    console.log(`[WebhookProcessor] Job adicionado: ${jobId}`);
    
    // Iniciar processamento se não estiver executando
    if (!this.processing) {
      this.startProcessing();
    }

    return jobId;
  }

  /**
   * Inicia o loop de processamento
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    console.log(`[WebhookProcessor] Iniciando processamento de webhooks`);

    while (this.jobs.size > 0) {
      const now = new Date();
      
      // Encontrar jobs prontos para processamento
      const readyJobs = Array.from(this.jobs.values())
        .filter(job => job.processAt <= now)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (readyJobs.length === 0) {
        // Aguardar um pouco antes de verificar novamente
        await this.sleep(1000);
        continue;
      }

      // Processar próximo job
      const job = readyJobs[0];
      
      try {
        await this.processJob(job);
        this.jobs.delete(job.id);
        console.log(`[WebhookProcessor] Job ${job.id} processado com sucesso`);
      } catch (error) {
        console.error(`[WebhookProcessor] Erro ao processar job ${job.id}:`, error);
        
        if (job.retries < this.maxRetries) {
          job.retries++;
          job.processAt = new Date(Date.now() + this.retryDelay * job.retries);
          console.log(`[WebhookProcessor] Job ${job.id} será reprocessado em ${this.retryDelay * job.retries}ms (tentativa ${job.retries})`);
        } else {
          console.error(`[WebhookProcessor] Job ${job.id} falhou após ${this.maxRetries} tentativas, removendo da fila`);
          this.jobs.delete(job.id);
        }
      }
    }

    this.processing = false;
    console.log(`[WebhookProcessor] Processamento finalizado`);
  }

  /**
   * Processa um job individual
   */
  private async processJob(job: WebhookJob): Promise<void> {
    const { event } = job;
    
    console.log(`[WebhookProcessor] Processando job ${job.id} - Evento ${event.code} da loja ${event.shop_id}`);

    switch (event.code) {
      case 1: // Produto criado/atualizado
        await this.handleProductUpdate(event);
        break;
      
      case 2: // Novo pedido
        await this.handleNewOrder(event);
        break;
      
      case 3: // Pedido cancelado
        await this.handleOrderCancellation(event);
        break;
      
      default:
        console.log(`[WebhookProcessor] Tipo de evento não suportado: ${event.code}`);
    }
  }

  /**
   * Processa atualização de produto
   */
  private async handleProductUpdate(event: any): Promise<void> {
    try {
      const store = await storage.getStoreByShopId(String(event.shop_id));
      if (!store) {
        console.warn(`[WebhookProcessor] Loja ${event.shop_id} não encontrada`);
        return;
      }

      // Sincronizar dados da loja para pegar as atualizações
      console.log(`[WebhookProcessor] Iniciando sincronização da loja ${event.shop_id}`);
      const result = await syncStore(store.id);
      
      if (result.success) {
        console.log(`[WebhookProcessor] Sincronização da loja ${event.shop_id} concluída: ${result.processed} itens processados`);
      } else {
        console.error(`[WebhookProcessor] Falha na sincronização da loja ${event.shop_id}:`, result.errors);
      }

      // Criar notificação para o usuário
      await storage.createNotification({
        userId: store.userId,
        title: 'Produto atualizado',
        message: `Um produto foi atualizado na sua loja ${store.shopName}`,
        type: 'info',
        isRead: false,
        createdAt: new Date()
      });

    } catch (error) {
      console.error('[WebhookProcessor] Erro ao processar atualização de produto:', error);
      throw error;
    }
  }

  /**
   * Processa novo pedido
   */
  private async handleNewOrder(event: any): Promise<void> {
    try {
      const store = await storage.getStoreByShopId(String(event.shop_id));
      if (!store) {
        console.warn(`[WebhookProcessor] Loja ${event.shop_id} não encontrada`);
        return;
      }

      // Criar notificação ao usuário
      await storage.createNotification({
        userId: store.userId,
        title: 'Novo pedido recebido',
        message: `Um novo pedido foi recebido na sua loja ${store.shopName}`,
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });

      console.log(`[WebhookProcessor] Notificação de novo pedido criada para usuário ${store.userId}`);
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao processar novo pedido:', error);
      throw error;
    }
  }

  /**
   * Processa cancelamento de pedido
   */
  private async handleOrderCancellation(event: any): Promise<void> {
    try {
      const store = await storage.getStoreByShopId(String(event.shop_id));
      if (!store) {
        console.warn(`[WebhookProcessor] Loja ${event.shop_id} não encontrada`);
        return;
      }

      // Criar notificação ao usuário
      await storage.createNotification({
        userId: store.userId,
        title: 'Pedido cancelado',
        message: `Um pedido foi cancelado na sua loja ${store.shopName}`,
        type: 'warning',
        isRead: false,
        createdAt: new Date()
      });

      console.log(`[WebhookProcessor] Notificação de cancelamento criada para usuário ${store.userId}`);
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao processar cancelamento de pedido:', error);
      throw error;
    }
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna estatísticas do processador
   */
  getStats(): { pendingJobs: number; processing: boolean } {
    return {
      pendingJobs: this.jobs.size,
      processing: this.processing
    };
  }
}

// Instância singleton do processador
export const webhookProcessor = new WebhookProcessor();
