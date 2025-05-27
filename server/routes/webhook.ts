
/**
 * Webhook handler para eventos da Shopee
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';

const router = Router();

/**
 * Valida a assinatura do webhook da Shopee
 */
function validateWebhookSignature(bodyString: string, receivedSignature: string, partnerKey: string): boolean {
  if (!receivedSignature) {
    console.error('[Webhook] Assinatura não encontrada no header Authorization');
    return false;
  }

  // Calcular assinatura HMAC-SHA256 usando o body exato
  const calculatedSignature = crypto
    .createHmac('sha256', partnerKey)
    .update(bodyString)
    .digest('hex');

  console.log('[Webhook] Validação:', {
    bodyLength: bodyString.length,
    receivedSig: receivedSignature.substring(0, 20) + '...',
    calculatedSig: calculatedSignature.substring(0, 20) + '...',
    match: calculatedSignature === receivedSignature
  });

  return calculatedSignature === receivedSignature;
}

/**
 * Handler para autorização de loja
 */
async function handleShopAuthorization(data: any, shopId: string) {
  try {
    console.log('[Webhook] Processando autorização da loja:', shopId);
    
    // Atualizar status da loja no banco
    const store = await storage.getStoreByShopId(shopId);
    if (store) {
      await storage.updateStore(store.id, {
        isActive: true,
        lastSyncAt: new Date()
      });
      console.log('[Webhook] Loja marcada como ativa');
    }
  } catch (error) {
    console.error('[Webhook] Erro ao processar autorização:', error);
  }
}

/**
 * Handler para atualização de pedido
 */
async function handleOrderUpdate(data: any, shopId: string) {
  const { ordersn, forder_id, package_number, tracking_no } = data;
  
  console.log('[Webhook] Pedido atualizado:', {
    shopId,
    ordersn,
    forder_id,
    package_number,
    tracking_no
  });

  // Aqui você pode implementar:
  // 1. Salvar informações do pedido no banco
  // 2. Atualizar métricas em tempo real
  // 3. Enviar notificações para o usuário
}

/**
 * Handler para desautorização de loja
 */
async function handleShopDeauthorization(shopId: string) {
  try {
    console.log('[Webhook] Processando desautorização da loja:', shopId);
    
    // Marcar loja como inativa
    const store = await storage.getStoreByShopId(shopId);
    if (store) {
      await storage.updateStore(store.id, {
        isActive: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null
      });

      // Criar notificação para o usuário
      await storage.createNotification({
        userId: store.userId,
        title: 'Loja Desconectada',
        message: 'Sua loja Shopee foi desconectada. Reconecte para continuar usando o CIP.',
        type: 'warning',
        isRead: false
      });

      console.log('[Webhook] Loja desativada e notificação criada');
    }
  } catch (error) {
    console.error('[Webhook] Erro ao processar desautorização:', error);
  }
}

/**
 * Endpoint principal do webhook
 */
router.post('/shopee/webhook', async (req: Request, res: Response) => {
  try {
    // Obter o body como string para validação de assinatura
    const bodyString = JSON.stringify(req.body);
    const receivedSignature = req.headers['authorization'] as string;
    
    console.log('[Webhook] Recebido:', {
      contentType: req.headers['content-type'],
      authorization: receivedSignature ? receivedSignature.substring(0, 20) + '...' : 'não presente',
      bodySize: bodyString.length
    });

    // Validar assinatura
    const partnerKey = process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661';
    const isValidSignature = validateWebhookSignature(bodyString, receivedSignature, partnerKey);

    if (!isValidSignature) {
      console.error('[Webhook] Assinatura inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse do body
    const { code, data, shop_id, timestamp, msg_id } = req.body;

    console.log('[Webhook] Evento processado:', {
      code,
      shop_id,
      msg_id,
      timestamp: new Date(timestamp * 1000)
    });

    // Processar evento baseado no código
    switch (code) {
      case 0: // TEST_PUSH
        console.log('[Webhook] Teste de webhook recebido');
        break;

      case 3: // SHOP_AUTHORIZATION
        console.log('[Webhook] Loja autorizada:', shop_id);
        await handleShopAuthorization(data, shop_id.toString());
        break;

      case 4: // ORDER_STATUS_UPDATE
        console.log('[Webhook] Atualização de pedido');
        await handleOrderUpdate(data, shop_id.toString());
        break;

      case 5: // SHOP_DEAUTHORIZATION
        console.log('[Webhook] Loja desautorizada:', shop_id);
        await handleShopDeauthorization(shop_id.toString());
        break;

      default:
        console.log(`[Webhook] Código de evento não implementado: ${code}`);
    }

    // Resposta obrigatória para a Shopee
    res.status(200).json({ message: 'success' });

  } catch (error) {
    console.error('[Webhook] Erro no processamento:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
