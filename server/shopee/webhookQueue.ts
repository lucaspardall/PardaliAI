
interface WebhookJob {
  shopId: string;
  eventData: any;
  timestamp: number;
}

class WebhookQueue {
  private processingJobs = new Map<string, Promise<void>>();
  
  async processWebhook(shopId: string, eventData: any): Promise<void> {
    const jobKey = `webhook_${shopId}`;
    
    // Se já há um job processando para esta loja, aguardar
    if (this.processingJobs.has(jobKey)) {
      console.log(`[Webhook] Aguardando processamento anterior para loja ${shopId}`);
      await this.processingJobs.get(jobKey);
    }
    
    // Criar novo job
    const jobPromise = this.executeWebhookJob(shopId, eventData);
    this.processingJobs.set(jobKey, jobPromise);
    
    try {
      await jobPromise;
    } finally {
      this.processingJobs.delete(jobKey);
    }
  }
  
  private async executeWebhookJob(shopId: string, eventData: any): Promise<void> {
    try {
      console.log(`[Webhook] Processando evento para loja ${shopId}`);
      const { processShopeeWebhookEvent } = await import('./webhooks');
      await processShopeeWebhookEvent(eventData);
      console.log(`[Webhook] ✅ Evento processado com sucesso para loja ${shopId}`);
    } catch (error) {
      console.error(`[Webhook] ❌ Erro ao processar evento para loja ${shopId}:`, error);
      throw error;
    }
  }
  
  getStats() {
    return {
      activeJobs: this.processingJobs.size,
      processingShops: Array.from(this.processingJobs.keys())
    };
  }
}

export const webhookQueue = new WebhookQueue();
