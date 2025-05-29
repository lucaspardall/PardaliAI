/**
 * Sistema de processamento de webhooks da Shopee
 */
import { Request, Response } from 'express';
import { createHmac } from 'crypto';
import { storage } from '../storage';
import { WebhookEvent } from './types';

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
async function validateWebhookSignature(req: Request, partnerKey: string): Promise<boolean> {
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
  const signature = req.headers['authorization'] as string;
  const body = req.body;

  // Log detalhado para debug
  console.log('[Webhook] 📥 Processando webhook da Shopee');
  console.log('[Webhook] Assinatura recebida:', signature);
  console.log('[Webhook] Corpo da requisição:', JSON.stringify(body, null, 2));

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
    const isValidSignature = await validateWebhookSignature(req, partnerKey);
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

      case 1: // Shop authorization by user (novo)
        console.log('[Webhook] Autorização de loja pelo usuário:', data);
        await handleShopAuthorizationByUser(data, shop_id);
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

      case 10: // Notification (mensagens/chat)
        console.log('[Webhook] Notificação recebida:', data);
        await handleChatNotification(data, shop_id);
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
    // Criar uma tabela de logs de webhook si não existir
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

/**
 * Processa atualização de pedido
 */
async function processOrderUpdate(storeId: string, data: any): Promise<void> {
  try {
    console.log(`[Webhook] Processando atualização de pedido para loja ${storeId}:`, data);

    // Implementar lógica de atualização de pedido
    // Por exemplo: salvar no banco, notificar usuário, etc.

  } catch (error) {
    console.error(`[Webhook] Erro ao processar atualização de pedido:`, error);
  }
}

/**
 * Processa atualização de produto
 */
async function processProductUpdate(storeId: string, data: any): Promise<void> {
  try {
    console.log(`[Webhook] Processando atualização de produto para loja ${storeId}:`, data);

    // Implementar lógica de atualização de produto
    // Por exemplo: sincronizar dados, atualizar cache, etc.

  } catch (error) {
    console.error(`[Webhook] Erro ao processar atualização de produto:`, error);
  }
}

/**
 * Processa atualização de loja
 */
async function processShopUpdate(storeId: string, data: any): Promise<void> {
  try {
    console.log(`[Webhook] Processando atualização de loja ${storeId}:`, data);

    // Implementar lógica de atualização de loja
    // Por exemplo: atualizar informações no banco, etc.

  } catch (error) {
    console.error(`[Webhook] Erro ao processar atualização de loja:`, error);
  }
}


/**
 * Processa evento de webhook da Shopee
 */
export async function processShopeeWebhookEvent(eventData: any): Promise<void> {
  try {
    console.log('[Webhook] Processando evento:', eventData);

    // Validar dados básicos
    if (!eventData || typeof eventData !== 'object') {
      console.warn('[Webhook] Dados de evento inválidos');
      return;
    }

    const { code, shop_id, data, timestamp } = eventData;

    // Extrair shop_id do evento (múltiplas fontes possíveis)
  const shopId = event.shop_id || 
                 event.data?.shop_id || 
                 event.shopid || 
                 event.data?.shopid;

  console.log('[Webhook] Buscando shop_id em:', {
    'event.shop_id': event.shop_id,
    'event.data?.shop_id': event.data?.shop_id,
    'event.shopid': event.shopid,
    'event.data?.shopid': event.data?.shopid,
    'shopId_encontrado': shopId
  });

  if (!shopId) {
    console.log('[Webhook] ❌ Shop ID ausente no evento - dados completos:', JSON.stringify(event, null, 2));
    return;
  }

  console.log(`[Webhook] ✅ Shop ID encontrado: ${shopId}`);

    // Converter shop_id para string de forma segura
    const shopIdStr = String(shop_id);

    console.log(`[Webhook] Buscando loja ${shopIdStr} no banco...`);

    // Buscar loja no banco com tratamento de erro
    let store;
    try {
      store = await storage.getStoreByShopId(shopIdStr);
    } catch (dbError) {
      console.error(`[Webhook] Erro ao buscar loja ${shopIdStr}:`, dbError);
      return;
    }

    if (!store) {
      console.warn(`[Webhook] Loja ${shopIdStr} não encontrada no banco`);
      return;
    }

    console.log(`[Webhook] Loja ${store.shopName} encontrada, processando evento ${code}...`);

    // Processar diferentes tipos de eventos com validação
    try {
      switch (Number(code)) {
        case 1: // Order update
          if (data && typeof data === 'object') {
            await processOrderUpdate(store.id, data);
          }
          break;
        case 2: // Product update  
          if (data && typeof data === 'object') {
            await processProductUpdate(store.id, data);
          }
          break;
        case 3: // Shop update
          if (data && typeof data === 'object') {
            await processShopUpdate(store.id, data);
          }
          break;
        default:
          console.log(`[Webhook] Evento não reconhecido: ${code}`);
      }
    } catch (processError) {
      console.error(`[Webhook] Erro ao processar evento ${code}:`, processError);
      return;
    }

    console.log(`[Webhook] ✅ Evento processado com sucesso para loja ${shopIdStr}`);

  } catch (error) {
    console.error('[Webhook] Erro crítico no processamento:', error);
    // Não re-throw para evitar crash do servidor
  }
}

/**
 * Handler para autorização de loja por usuário (código 1)
 */
async function handleShopAuthorizationByUser(data: any, shop_id: string): Promise<void> {
  try {
    console.log(`[Webhook] Processando autorização de loja ${shop_id} pelo usuário:`, data);

    if (data.success === 1) {
      console.log(`[Webhook] ✅ Loja ${shop_id} autorizada com sucesso`);

      // Aqui você pode implementar lógica adicional se necessário
      // Como atualizar o status da loja no banco de dados

    } else {
      console.log(`[Webhook] ❌ Falha na autorização da loja ${shop_id}`);
    }

  } catch (error) {
    console.error(`[Webhook] Erro ao processar autorização da loja ${shop_id}:`, error);
  }
}

/**
 * Handler para notificações de chat/mensagens (código 10)
 */
async function handleChatNotification(data: any, shop_id: number): Promise<void> {
  try {
    console.log(`[Webhook] Processando notificação de chat para loja ${shop_id}:`, data);

    const { content, type } = data;
    
    if (type === 'notification' && content) {
      const { user_id, conversation_id, type: contentType } = content;
      
      // Encontrar a loja no banco de dados
      const store = await storage.getStoreByShopId(shop_id.toString());

      if (store) {
        // Criar notificação baseada no tipo de evento
        let notificationTitle = 'Nova Atividade de Chat';
        let notificationMessage = '';

        switch (contentType) {
          case 'mark_as_replied':
            notificationTitle = 'Mensagem Respondida';
            notificationMessage = `Uma mensagem foi marcada como respondida na loja ${store.shopName}`;
            break;
          default:
            notificationMessage = `Nova atividade de chat na loja ${store.shopName}`;
        }

        await storage.createNotification({
          userId: store.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'info',
          isRead: false,
          createdAt: new Date()
        });

        console.log(`[Webhook] ✅ Notificação de chat criada para usuário ${store.userId}`);
      } else {
        console.log(`[Webhook] ⚠️ Loja ${shop_id} não encontrada para notificação de chat`);
      }
    }

  } catch (error) {
    console.error(`[Webhook] ❌ Erro ao processar notificação de chat:`, error);
  }
}