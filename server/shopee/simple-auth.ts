/**
 * Implementação simplificada de autenticação Shopee
 * Usando apenas os parâmetros essenciais para gerar o URL de autorização
 */

import { createHmac } from 'crypto';

export function generateShopeeAuthUrl() {
  // Usar IDs de teste conforme as imagens compartilhadas
  const partnerId = "1279702"; // ID de teste exato compartilhado pelo usuário
  const partnerKey = "71707a74654a474644465746576b515048717161415178526a7a534677484943"; // Chave exata compartilhada pelo usuário 
  const timestamp = Math.floor(Date.now() / 1000);
  
  // URL de redirecionamento EXATA como mostrada nas imagens
  const redirectUrl = "https://cipshopee.replit.app";
  
  // Criar assinatura HMAC-SHA256
  const baseString = `${partnerId}/api/v2/shop/auth_partner${timestamp}`;
  const hmac = createHmac('sha256', partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');
  
  // Gerar URL de autorização com parâmetros mínimos necessários
  return `https://partner.shopeemobile.com/api/v2/shop/auth_partner?` +
    `partner_id=${partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(redirectUrl)}`;
}

export function generateShopeeAuthPage() {
  const authUrl = generateShopeeAuthUrl();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Conectar Loja Shopee</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        .container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 30px;
          margin-top: 20px;
        }
        .header {
          background: linear-gradient(135deg, #ee4d2d 0%, #ff7337 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
        h1 {
          margin-top: 0;
        }
        .btn {
          display: inline-block;
          background: #ee4d2d;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
        }
        .url-display {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          font-family: monospace;
          word-break: break-all;
          margin: 20px 0;
          font-size: 13px;
        }
        .step {
          margin-bottom: 15px;
          padding-left: 20px;
          border-left: 3px solid #ee4d2d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Conectar Loja Shopee</h1>
        <p>Siga as instruções abaixo para conectar sua loja da Shopee ao CIP Pardal</p>
      </div>
      
      <div class="container">
        <h2>Instruções</h2>
        
        <div class="step">
          <h3>1. Clique no botão abaixo</h3>
          <p>Você será redirecionado para a página de autorização da Shopee.</p>
        </div>
        
        <div class="step">
          <h3>2. Faça login na sua conta de vendedor</h3>
          <p>Use suas credenciais da conta Shopee onde você vende seus produtos.</p>
        </div>
        
        <div class="step">
          <h3>3. Autorize o acesso</h3>
          <p>Revise as permissões solicitadas e autorize o acesso à sua loja.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${authUrl}" class="btn">Conectar Loja Shopee</a>
        </div>
        
        <p><strong>Detalhes técnicos:</strong> Estamos usando a autorização OAuth da Shopee Open Platform para acessar sua loja de forma segura. Nenhuma senha é compartilhada com o CIP Pardal.</p>
        
        <div class="url-display">
          URL de autorização: ${authUrl}
        </div>
      </div>
    </body>
    </html>
  `;
}