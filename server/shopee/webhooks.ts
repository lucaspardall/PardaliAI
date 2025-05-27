/**
 * Sistema de processamento de webhooks da Shopee
 */
import { Request, Response } from 'express';
import { createHmac } from 'crypto';
import { storage } from '../storage';

/**
 * Códigos de eventos de webhook da Shopee
 */
export const WEBHOOK_CODES = {
  0: 'TEST_PUSH',
  3: 'SHOP_AUTHORIZATION', 
  4: 'ORDER_STATUS_UPDATE',
  5: 'SHOP_DEAUTHORIZATION',
  6: 'PRODUCT_UPDATE',
  7: 'BANNED_ITEM',
  9: 'SHOP_UPDATE',
  10: 'BRAND_REGISTER'
} as const;

/**
 * Valida a assinatura do webhook da Shopee
 * A Shopee usa formato: URL|BODY para gerar a assinatura
 */
function validateWebhookSignature(req: Request, partnerKey: string): boolean {
  try {
    const receivedSignature = req.headers['authorization'];

    if (!receivedSignature) {
      console.error('[Webhook] Assinatura não encontrada no header authorization');
      return false;
    }

    // Reconstruir a URL completa do webhook
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    const url = `${protocol}://${host}${req.originalUrl}`;

    // Corpo da requisição como string JSON
    const bodyString = JSON.stringify(req.body);

    // String base para assinatura: URL|BODY
    const baseString = `${url}|${bodyString}`;

    // Gerar assinatura HMAC-SHA256
    const calculatedSignature = createHmac('sha256', partnerKey)
      .update(baseString)
      .digest('hex');

    console.log('[Webhook] Validando assinatura:', {
      url,
      bodyLength: bodyString.length,
      baseStringLength: baseString.length,
      received: receivedSignature.substring(0, 20) + '...',
      calculated: calculatedSignature.substring(0, 20) + '...',
      match: calculatedSignature === receivedSignature
    });

    return calculatedSignature === receivedSignature;
  } catch (error) {
    console.error('[Webhook] Erro na validação da assinatura:', error);
    return false;
  }
}

/**
 * Processa webhook de autorização de loja
 */
async function handleShopAuthorization(data: any, shopId: number): Promise<void> {
  console.log(`[Webhook] Loja ${shopId} autorizada:`, data);

  try {
    // Encontrar a loja no banco de dados
    const store = await storage.getStoreByShopId(shopId.toString());

    if (store) {
      // Atualizar status da loja para ativa
      await storage.updateStore(store.id, {
        isActive: true,
        updatedAt: new Date()
      });

      console.log(`[Webhook] Loja ${shopId} marcada como ativa`);
    } else {
      console.log(`[Webhook] Loja ${shopId} não encontrada no banco de dados`);
    }
  } catch (error) {
    console.error(`[Webhook] Erro ao processar autorização da loja ${shopId}:`, error);
  }
}

/**
 * Processa webhook de atualização de pedido
 */
async function handleOrderUpdate(data: any, shopId: number): Promise<void> {
  console.log(`[Webhook] Pedido atualizado na loja ${shopId}:`, data);

  try {
    const { ordersn, forder_id, package_number, tracking_no } = data;

    // Encontrar a loja no banco de dados
    const store = await storage.getStoreByShopId(shopId.toString());

    if (store) {
      console.log(`[Webhook] Processando atualização do pedido ${ordersn} para loja ${store.shopName}`);

      // Aqui você pode implementar a lógica para:
      // 1. Atualizar dados do pedido no banco
      // 2. Sincronizar informações de entrega
      // 3. Notificar o usuário sobre mudanças

      // Criar notificação para o usuário
      await storage.createNotification({
        userId: store.userId,
        title: 'Pedido Atualizado',
        message: `Pedido ${ordersn} foi atualizado - Rastreamento: ${tracking_no}`,
        type: 'info',
        isRead: false,
        createdAt: new Date()
      });

      console.log(`[Webhook] Notificação criada para atualização do pedido ${ordersn}`);
    } else {
      console.log(`[Webhook] Loja ${shopId} não encontrada para pedido ${ordersn}`);
    }
  } catch (error) {
    console.error(`[Webhook] Erro ao processar atualização de pedido:`, error);
  }
}

/**
 * Processa webhook de desautorização de loja
 */
async function handleShopDeauthorization(data: any, shopId: number): Promise<void> {
  console.log(`[Webhook] Loja ${shopId} desautorizada:`, data);

  try {
    // Encontrar a loja no banco de dados
    const store = await storage.getStoreByShopId(shopId.toString());

    if (store) {
      // Marcar loja como inativa
      await storage.updateStore(store.id, {
        isActive: false,
        updatedAt: new Date()
      });

      // Criar notificação para o usuário
      await storage.createNotification({
        userId: store.userId,
        title: 'Loja Desconectada',
        message: `A loja ${store.shopName} foi desconectada da Shopee`,
        type: 'warning',
        isRead: false,
        createdAt: new Date()
      });

      console.log(`[Webhook] Loja ${shopId} marcada como inativa`);
    }
  } catch (error) {
    console.error(`[Webhook] Erro ao processar desautorização da loja ${shopId}:`, error);
  }
}

/**
 * Manipula webhooks recebidos da Shopee
 */
export async function handleShopeeWebhook(req: Request, res: Response): Promise<void> {
  try {
    console.log('[Webhook] Recebendo webhook - Headers:', req.headers);
    console.log('[Webhook] Corpo do webhook:', req.body);

    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    if (!partnerKey) {
      console.error('[Webhook] SHOPEE_PARTNER_KEY não configurada');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Debug da assinatura se estiver em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const { debugWebhookSignature, saveWebhookForAnalysis } = await import('./webhookDebug');
      debugWebhookSignature(req, partnerKey);
      saveWebhookForAnalysis(req);
    }

    // Validar assinatura
    const isValidSignature = validateWebhookSignature(req, partnerKey);
    if (!isValidSignature) {
      console.error('[Webhook] Assinatura inválida:', {
        received: req.headers['authorization'],
        body: JSON.stringify(req.body).substring(0, 100) + '...'
      });

      // Em desenvolvimento, ainda processar mesmo com assinatura inválida para debug
      if (process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ error: 'Invalid signature' });
      } else {
        console.warn('[Webhook] Processando mesmo com assinatura inválida (modo desenvolvimento)');
      }
    }

    const { code, data, shop_id, timestamp, msg_id } = req.body;

    console.log(`[Webhook] Evento recebido - Código: ${code}, Loja: ${shop_id}, Timestamp: ${timestamp}, MSG ID: ${msg_id}`);

    // Verificar se é um evento duplicado baseado no msg_id
    if (msg_id) {
      // Aqui você poderia implementar verificação de duplicatas se necessário
      console.log(`[Webhook] Processando evento único: ${msg_id}`);
    }

    // Processar webhook baseado no código
    switch (code) {
      case 0: // Test push
        console.log('[Webhook] Webhook de teste recebido');
        break;

      case 3: // Shop authorization
        await handleShopAuthorization(data, shop_id);
        break;

      case 4: // Order status update
        await handleOrderUpdate(data, shop_id);
        break;

      case 5: // Shop deauthorization
        await handleShopDeauthorization(data, shop_id);
        break;

      case 6: // Product update
        console.log('[Webhook] Atualização de produto:', data);
        // Implementar lógica de sincronização de produto se necessário
        break;

      case 7: // Banned item
        console.log('[Webhook] Item banido:', data);
        break;

      case 9: // Shop update
        console.log('[Webhook] Atualização da loja:', data);
        break;

      default:
        console.log(`[Webhook] Código de evento não tratado: ${code}`, {
          eventCode: code,
          data,
          shopId: shop_id
        });
    }

    // Sempre responder com sucesso rapidamente (< 5 segundos)
    res.status(200).json({ 
      message: 'ok',
      processed: true,
      eventCode: code,
      msgId: msg_id
    });

  } catch (error) {
    console.error('[Webhook] Erro no processamento:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Salva log do evento webhook para auditoria
 */
async function logWebhookEvent(event: WebhookEvent, rawBody: string, signature: string): Promise<void> {
  try {
    // Criar uma tabela de logs de webhook se não existir
    // Por enquanto, apenas log no console
    console.log(`[Webhook] Evento registrado:`, {
      code: event.code,
      shop_id: event.shop_id,
      timestamp: event.timestamp,
      signature: signature.substring(0, 20) + '...',
      bodySize: rawBody.length
    });
  } catch (error) {
    console.error('[Webhook] Erro ao salvar log do evento:', error);
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