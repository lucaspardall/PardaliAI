
/**
 * Utilitário para testar webhooks da Shopee localmente
 */
import crypto from 'crypto';
import axios from 'axios';

interface WebhookTestData {
  code: number;
  shop_id: number;
  data?: any;
}

/**
 * Envia um webhook de teste
 */
export async function sendTestWebhook(testData: WebhookTestData, webhookUrl: string = 'https://cipshopee.replit.app/api/webhook/shopee/webhook') {
  const partnerKey = process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661';
  
  // Construir payload do webhook
  const payload = {
    msg_id: `test_${Date.now()}`,
    code: testData.code,
    shop_id: testData.shop_id,
    timestamp: Math.floor(Date.now() / 1000),
    data: testData.data || {}
  };

  const bodyString = JSON.stringify(payload);

  // Calcular assinatura HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', partnerKey)
    .update(bodyString)
    .digest('hex');

  console.log('[Webhook Test] Enviando webhook:', {
    url: webhookUrl,
    code: testData.code,
    shop_id: testData.shop_id,
    signature: signature.substring(0, 20) + '...'
  });

  try {
    const response = await axios.post(webhookUrl, bodyString, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': signature
      },
      timeout: 10000
    });

    console.log('[Webhook Test] Resposta:', response.status, response.data);
    return { success: true, response: response.data };

  } catch (error: any) {
    console.error('[Webhook Test] Erro:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Testes de webhook específicos
 */
export const webhookTests = {
  // Teste de conexão
  async testConnection() {
    return await sendTestWebhook({
      code: 0, // TEST_PUSH
      shop_id: 404065079
    });
  },

  // Teste de autorização de loja
  async testShopAuthorization(shopId: number) {
    return await sendTestWebhook({
      code: 3, // SHOP_AUTHORIZATION
      shop_id: shopId,
      data: {
        shop_name: "Loja Teste",
        shop_logo: "https://example.com/logo.png"
      }
    });
  },

  // Teste de atualização de pedido
  async testOrderUpdate(shopId: number) {
    return await sendTestWebhook({
      code: 4, // ORDER_STATUS_UPDATE
      shop_id: shopId,
      data: {
        ordersn: "25052703MJXT0P",
        forder_id: "5705528466476546079",
        package_number: "OFG202003912147986",
        tracking_no: "BR2537042054364"
      }
    });
  },

  // Teste de desautorização
  async testShopDeauthorization(shopId: number) {
    return await sendTestWebhook({
      code: 5, // SHOP_DEAUTHORIZATION
      shop_id: shopId
    });
  }
};
