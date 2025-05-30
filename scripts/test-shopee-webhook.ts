
/**
 * Script para testar a validação de assinatura do webhook Shopee
 */
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface WebhookTestConfig {
  webhookUrl: string;
  pushPartnerKey: string;
  testPayloads: any[];
}

class ShopeeWebhookTester {
  private config: WebhookTestConfig;

  constructor() {
    this.config = {
      webhookUrl: process.env.SHOPEE_WEBHOOK_URL || 'http://localhost:3000/api/shopee/webhook',
      pushPartnerKey: process.env.SHOPEE_PUSH_PARTNER_KEY || process.env.SHOPEE_PARTNER_KEY || '',
      testPayloads: [
        {
          // Teste 1: Webhook de teste
          code: 0,
          timestamp: Math.floor(Date.now() / 1000)
        },
        {
          // Teste 2: Autorização de loja
          code: 1,
          data: {
            authorize_type: "shop authorization by user",
            extra: "shop id 404065079 (BR) has been authorized successfully",
            shop_id: 404065079,
            success: 1
          },
          timestamp: Math.floor(Date.now() / 1000)
        },
        {
          // Teste 3: Atualização de pedido
          code: 4,
          data: {
            ordersn: "2501234567890",
            status: "READY_TO_SHIP",
            update_time: Math.floor(Date.now() / 1000),
            shop_id: 404065079
          },
          timestamp: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }

  // Gera assinatura correta para o webhook
  generateSignature(url: string, body: any): string {
    // Remove query string e porta da URL
    const cleanUrl = url.split('?')[0].replace(/:(\d+)/, '');
    
    // Serializa o body com keys ordenadas
    const bodyString = JSON.stringify(body, Object.keys(body).sort());
    
    // Cria string base
    const baseString = `${cleanUrl}|${bodyString}`;
    
    // Gera HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', this.config.pushPartnerKey)
      .update(baseString)
      .digest('hex');
    
    console.log('📝 Detalhes da assinatura:');
    console.log('   URL:', cleanUrl);
    console.log('   Body length:', bodyString.length);
    console.log('   Base string length:', baseString.length);
    console.log('   Signature:', signature.substring(0, 20) + '...');
    
    return signature;
  }

  // Envia webhook de teste
  async sendTestWebhook(payload: any, testName: string): Promise<void> {
    console.log(`\n🧪 Teste: ${testName}`);
    console.log('━'.repeat(50));
    
    try {
      const signature = this.generateSignature(this.config.webhookUrl, payload);
      
      console.log('📤 Enviando webhook...');
      const startTime = Date.now();
      
      const response = await axios.post(this.config.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': signature
        },
        validateStatus: () => true // Aceita qualquer status
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`📥 Resposta recebida em ${duration}ms`);
      console.log('   Status:', response.status);
      console.log('   Body:', response.data);
      
      // Validação dos resultados
      if (response.status === 200) {
        console.log('✅ Webhook aceito com sucesso!');
      } else if (response.status === 401) {
        console.log('❌ Falha na autenticação - verifique a SHOPEE_PUSH_PARTNER_KEY');
      } else if (response.status === 500) {
        console.log('❌ Erro no servidor - verifique os logs');
      } else {
        console.log('⚠️  Status inesperado:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar webhook:', error);
    }
  }

  // Executa todos os testes
  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando testes de webhook Shopee');
    console.log('═'.repeat(50));
    
    // Validação de configuração
    if (!this.config.pushPartnerKey) {
      console.error('❌ SHOPEE_PUSH_PARTNER_KEY não configurada!');
      console.log('   Configure no .env ou passe como variável de ambiente');
      return;
    }
    
    console.log('📋 Configuração:');
    console.log('   Webhook URL:', this.config.webhookUrl);
    console.log('   Push Partner Key:', this.config.pushPartnerKey.substring(0, 10) + '...');
    
    // Teste 1: Webhook de teste
    await this.sendTestWebhook(
      this.config.testPayloads[0],
      'Webhook de Teste (code: 0)'
    );
    
    // Teste 2: Autorização de loja
    await this.sendTestWebhook(
      this.config.testPayloads[1],
      'Autorização de Loja (code: 1)'
    );
    
    // Teste 3: Atualização de pedido
    await this.sendTestWebhook(
      this.config.testPayloads[2],
      'Atualização de Pedido (code: 4)'
    );
    
    console.log('\n✅ Testes concluídos!');
    console.log('═'.repeat(50));
  }
}

// Execução do script
async function main() {
  const tester = new ShopeeWebhookTester();
  await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { ShopeeWebhookTester };

