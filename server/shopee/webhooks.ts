
/**
 * Módulo para tratamento de webhooks da Shopee
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';
import { syncStore } from './sync';

interface WebhookEvent {
  code: number;
  shop_id: number;
  timestamp: number;
  data: any;
}

/**
 * Verifica assinatura do webhook
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  partnerKey: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', partnerKey)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Erro ao verificar assinatura do webhook:', error);
    return false;
  }
}

/**
 * Processa webhook de atualização de produto
 */
async function handleProductUpdate(event: WebhookEvent): Promise<void> {
  try {
    console.log(`[Webhook] Produto atualizado - Shop: ${event.shop_id}, Data:`, event.data);

    const store = await storage.getStoreByShopId(String(event.shop_id));
    if (!store) {
      console.warn(`[Webhook] Loja ${event.shop_id} não encontrada`);
      return;
    }

    // Sincronizar dados da loja para pegar as atualizações
    await syncStore(store.id);

    console.log(`[Webhook] Sincronização da loja ${event.shop_id} concluída`);
  } catch (error) {
    console.error('[Webhook] Erro ao processar atualização de produto:', error);
  }
}

/**
 * Processa webhook de novo pedido
 */
async function handleNewOrder(event: WebhookEvent): Promise<void> {
  try {
    console.log(`[Webhook] Novo pedido - Shop: ${event.shop_id}, Data:`, event.data);

    const store = await storage.getStoreByShopId(String(event.shop_id));
    if (!store) {
      console.warn(`[Webhook] Loja ${event.shop_id} não encontrada`);
      return;
    }

    // Atualizar métricas ou processar o pedido conforme necessário
    // Por exemplo, enviar notificação ao usuário
    await storage.createNotification({
      userId: store.userId,
      title: 'Novo pedido recebido',
      message: `Um novo pedido foi recebido na sua loja ${store.shopName}`,
      type: 'info',
      isRead: false,
      createdAt: new Date()
    });

    console.log(`[Webhook] Notificação de novo pedido criada para usuário ${store.userId}`);
  } catch (error) {
    console.error('[Webhook] Erro ao processar novo pedido:', error);
  }
}

/**
 * Processa webhook de cancelamento de pedido
 */
async function handleOrderCancellation(event: WebhookEvent): Promise<void> {
  try {
    console.log(`[Webhook] Pedido cancelado - Shop: ${event.shop_id}, Data:`, event.data);

    const store = await storage.getStoreByShopId(String(event.shop_id));
    if (!store) {
      console.warn(`[Webhook] Loja ${event.shop_id} não encontrada`);
      return;
    }

    // Enviar notificação ao usuário
    await storage.createNotification({
      userId: store.userId,
      title: 'Pedido cancelado',
      message: `Um pedido foi cancelado na sua loja ${store.shopName}`,
      type: 'warning',
      isRead: false,
      createdAt: new Date()
    });

    console.log(`[Webhook] Notificação de cancelamento criada para usuário ${store.userId}`);
  } catch (error) {
    console.error('[Webhook] Erro ao processar cancelamento de pedido:', error);
  }
}

/**
 * Handler principal para webhooks da Shopee
 */
export async function handleShopeeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['authorization'] as string;
    const body = JSON.stringify(req.body);
    
    if (!signature) {
      res.status(401).json({ error: 'Missing signature' });
      return;
    }

    // Verificar assinatura
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    if (!partnerKey) {
      console.error('[Webhook] Partner key não configurada');
      res.status(500).json({ error: 'Configuration error' });
      return;
    }

    const isValidSignature = verifyWebhookSignature(body, signature, partnerKey);
    if (!isValidSignature) {
      console.warn('[Webhook] Assinatura inválida');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event: WebhookEvent = req.body;
    
    console.log(`[Webhook] Evento recebido - Code: ${event.code}, Shop: ${event.shop_id}`);

    // Processar diferentes tipos de eventos
    switch (event.code) {
      case 1: // Produto criado/atualizado
        await handleProductUpdate(event);
        break;
      
      case 2: // Novo pedido
        await handleNewOrder(event);
        break;
      
      case 3: // Pedido cancelado
        await handleOrderCancellation(event);
        break;
      
      default:
        console.log(`[Webhook] Tipo de evento não tratado: ${event.code}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Webhook] Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware para parsing de webhook
 */
export function webhookParser(req: Request, res: Response, next: Function): void {
  // Para webhooks, precisamos do raw body para verificar a assinatura
  let data = '';
  
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  req.on('end', () => {
    try {
      req.body = JSON.parse(data);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  });
}
