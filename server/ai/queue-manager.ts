
import { EventEmitter } from 'events';

interface QueueItem {
  id: string;
  userId: string;
  type: 'product_optimization' | 'ad_creation' | 'store_analysis' | 'campaign_analysis';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  data: any;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

interface QueueResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

export class AIQueueManager extends EventEmitter {
  private queues: Map<string, QueueItem[]> = new Map();
  private processing: Set<string> = new Set();
  private workers: Map<string, boolean> = new Map();
  
  private readonly PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];
  private readonly MAX_CONCURRENT_JOBS = 3;
  private readonly RETRY_DELAYS = {
    urgent: 5000,   // 5 segundos
    high: 10000,    // 10 segundos  
    medium: 30000,  // 30 segundos
    low: 60000      // 1 minuto
  };

  constructor() {
    super();
    this.initializeQueues();
    this.startWorkers();
  }

  /**
   * Adiciona item à fila com prioridade
   */
  async enqueue(
    userId: string,
    type: QueueItem['type'],
    data: any,
    priority: QueueItem['priority'] = 'medium'
  ): Promise<string> {
    const itemId = `${type}_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const queueItem: QueueItem = {
      id: itemId,
      userId,
      type,
      priority,
      data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    // Adicionar à fila apropriada
    const queueKey = `${type}_${priority}`;
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }
    
    this.queues.get(queueKey)!.push(queueItem);
    
    // Emitir evento para processamento
    this.emit('item_added', { queueKey, itemId });
    
    console.log(`[Queue] Added ${type} job for user ${userId} with priority ${priority} (ID: ${itemId})`);
    
    return itemId;
  }

  /**
   * Remove item da fila (cancelamento)
   */
  async dequeue(itemId: string): Promise<boolean> {
    for (const [queueKey, items] of this.queues.entries()) {
      const index = items.findIndex(item => item.id === itemId);
      if (index !== -1) {
        items.splice(index, 1);
        console.log(`[Queue] Removed item ${itemId} from ${queueKey}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Obtém status da fila
   */
  getQueueStatus(): any {
    const status: any = {
      total: 0,
      byType: {},
      byPriority: {},
      processing: this.processing.size,
      workers: Array.from(this.workers.entries())
    };

    for (const [queueKey, items] of this.queues.entries()) {
      const [type, priority] = queueKey.split('_');
      
      status.total += items.length;
      status.byType[type] = (status.byType[type] || 0) + items.length;
      status.byPriority[priority] = (status.byPriority[priority] || 0) + items.length;
    }

    return status;
  }

  /**
   * Obtém posição na fila
   */
  getQueuePosition(itemId: string): number | null {
    let position = 0;
    
    // Verificar em ordem de prioridade
    for (const priority of this.PRIORITY_ORDER) {
      for (const type of ['product_optimization', 'ad_creation', 'store_analysis', 'campaign_analysis']) {
        const queueKey = `${type}_${priority}`;
        const queue = this.queues.get(queueKey) || [];
        
        for (let i = 0; i < queue.length; i++) {
          position++;
          if (queue[i].id === itemId) {
            return position;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Inicializa filas vazias
   */
  private initializeQueues(): void {
    const types = ['product_optimization', 'ad_creation', 'store_analysis', 'campaign_analysis'];
    const priorities = ['urgent', 'high', 'medium', 'low'];
    
    for (const type of types) {
      for (const priority of priorities) {
        this.queues.set(`${type}_${priority}`, []);
      }
    }
  }

  /**
   * Inicia workers para processamento
   */
  private startWorkers(): void {
    for (let i = 0; i < this.MAX_CONCURRENT_JOBS; i++) {
      const workerId = `worker_${i}`;
      this.workers.set(workerId, false);
      this.startWorker(workerId);
    }
  }

  /**
   * Worker individual para processar fila
   */
  private async startWorker(workerId: string): Promise<void> {
    console.log(`[Queue] Starting worker ${workerId}`);
    
    while (true) {
      try {
        // Encontrar próximo item por prioridade
        const nextItem = this.getNextItem();
        
        if (!nextItem) {
          // Não há itens, aguardar
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Marcar worker como ocupado
        this.workers.set(workerId, true);
        this.processing.add(nextItem.id);
        
        console.log(`[Queue] Worker ${workerId} processing ${nextItem.type} for user ${nextItem.userId}`);
        
        // Processar item
        const result = await this.processItem(nextItem);
        
        // Emitir resultado
        this.emit('item_processed', {
          itemId: nextItem.id,
          result,
          workerId
        });
        
      } catch (error) {
        console.error(`[Queue] Worker ${workerId} error:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } finally {
        // Marcar worker como livre
        this.workers.set(workerId, false);
      }
    }
  }

  /**
   * Encontra próximo item por prioridade
   */
  private getNextItem(): QueueItem | null {
    // Processar por ordem de prioridade
    for (const priority of this.PRIORITY_ORDER) {
      for (const type of ['product_optimization', 'ad_creation', 'store_analysis', 'campaign_analysis']) {
        const queueKey = `${type}_${priority}`;
        const queue = this.queues.get(queueKey) || [];
        
        if (queue.length > 0) {
          const item = queue.shift()!;
          return item;
        }
      }
    }
    
    return null;
  }

  /**
   * Processa item individual
   */
  private async processItem(item: QueueItem): Promise<QueueResult> {
    const startTime = Date.now();
    
    try {
      const { openaiClient } = await import('./openai-client');
      
      item.attempts++;
      
      const result = await openaiClient.runAssistant(
        item.type,
        item.data,
        item.userId
      );
      
      const processingTime = Date.now() - startTime;
      
      this.processing.delete(item.id);
      
      return {
        success: true,
        data: result.data,
        processingTime
      };
      
    } catch (error) {
      console.error(`[Queue] Error processing item ${item.id}:`, error);
      
      // Tentar novamente se não excedeu tentativas
      if (item.attempts < item.maxAttempts) {
        const delay = this.RETRY_DELAYS[item.priority];
        
        setTimeout(() => {
          const queueKey = `${item.type}_${item.priority}`;
          this.queues.get(queueKey)!.unshift(item); // Adicionar no início
          console.log(`[Queue] Retrying item ${item.id} in ${delay}ms (attempt ${item.attempts}/${item.maxAttempts})`);
        }, delay);
      }
      
      this.processing.delete(item.id);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }
}

export const queueManager = new AIQueueManager();
