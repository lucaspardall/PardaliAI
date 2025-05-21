/**
 * Implementação oficial de integração com Shopee
 * Baseada na configuração real do app "CIP Pardal" no console da Shopee
 */

import { createHmac } from 'crypto';

/**
 * Interface para configuração da API Shopee
 */
export interface ShopeeConfig {
  // IDs de ambiente de teste
  testPartnerId: string;
  testPartnerKey: string;
  // IDs de ambiente de produção
  livePartnerId: string;
  livePartnerKey: string;
  // URL de redirecionamento
  redirectUrl: string;
  // Ambiente atual ('test' ou 'live')
  environment: 'test' | 'live'; 
}

/**
 * Gera URL de autorização para conectar loja Shopee
 */
export function generateShopeeAuthUrl(config: ShopeeConfig): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const state = `cipshopee_${Date.now()}`;
  
  // Selecionar ID e chave com base no ambiente
  const partnerId = config.environment === 'test' 
    ? config.testPartnerId 
    : config.livePartnerId;
    
  const partnerKey = config.environment === 'test' 
    ? config.testPartnerKey 
    : config.livePartnerKey;
  
  // Gerar assinatura HMAC-SHA256
  // Formato baseado na documentação oficial e configuração validada
  const baseString = `${partnerId}/api/v2/shop/auth_partner${timestamp}`;
  const hmac = createHmac('sha256', partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');
  
  // Construir URL de autorização
  // Domínio partner.shopeemobile.com é o oficial conforme documentação
  const authUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?` +
    `partner_id=${partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${encodeURIComponent(state)}`;
    
  return authUrl;
}

/**
 * Gera HTML com interface para conexão de loja Shopee
 */
export function generateConnectionPage(config: ShopeeConfig): string {
  const authUrl = generateShopeeAuthUrl(config);
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Conectar Loja Shopee - CIP Pardal</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background: #f9f9f9;
        }
        .header {
          background: linear-gradient(135deg, #ee4d2d 0%, #ff7337 100%);
          padding: 20px;
          border-radius: 8px;
          color: white;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
        }
        .container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 30px;
          border: 1px solid #eee;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #ee4d2d;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          border: none;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          cursor: pointer;
          transition: background 0.2s;
          text-align: center;
        }
        .btn:hover {
          background: #d43c1e;
        }
        .info {
          background: #e3f2fd;
          border-left: 5px solid #2196f3;
          padding: 15px;
          margin: 15px 0;
        }
        .steps {
          margin: 20px 0;
        }
        .step {
          padding: 15px;
          border-left: 3px solid #ee4d2d;
          margin-bottom: 15px;
          background: #f9f9f9;
        }
        .step-number {
          display: inline-block;
          width: 30px;
          height: 30px;
          background: #ee4d2d;
          color: white;
          text-align: center;
          line-height: 30px;
          border-radius: 50%;
          margin-right: 10px;
          font-weight: bold;
        }
        .environment {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          margin-left: 10px;
        }
        .env-test {
          background: #ff9800;
          color: white;
        }
        .env-live {
          background: #4caf50;
          color: white;
        }
        .center {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Conectar Loja Shopee</h1>
        <p>Conecte sua loja da Shopee ao CIP Pardal para utilizar nossas ferramentas de otimização</p>
      </div>
      
      <div class="container">
        <h2>
          Ambiente: ${config.environment === 'test' ? 'Teste' : 'Produção'}
          <span class="environment ${config.environment === 'test' ? 'env-test' : 'env-live'}">
            ${config.environment === 'test' ? 'Teste' : 'Produção'}
          </span>
        </h2>
        
        <div class="info">
          <strong>Importante:</strong> Ao clicar no botão abaixo, você será redirecionado para a Shopee para autorizar o acesso do CIP Pardal à sua loja.
        </div>
        
        <div class="steps">
          <div class="step">
            <span class="step-number">1</span>
            <strong>Clique no botão "Conectar Loja Shopee"</strong><br>
            Você será redirecionado para a página de autorização da Shopee.
          </div>
          
          <div class="step">
            <span class="step-number">2</span>
            <strong>Faça login na sua conta de vendedor da Shopee</strong><br>
            Use as credenciais da sua conta de vendedor para fazer login.
          </div>
          
          <div class="step">
            <span class="step-number">3</span>
            <strong>Autorize o acesso</strong><br>
            Revise as permissões solicitadas e clique em "Autorizar" para conceder acesso ao CIP Pardal.
          </div>
          
          <div class="step">
            <span class="step-number">4</span>
            <strong>Pronto!</strong><br>
            Você será redirecionado de volta ao CIP Pardal com sua loja conectada.
          </div>
        </div>
        
        <div class="center">
          <a href="${authUrl}" class="btn">Conectar Loja Shopee</a>
        </div>
      </div>
    </body>
    </html>
  `;
}