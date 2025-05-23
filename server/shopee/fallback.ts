/**
 * Implementação alternativa para autenticação com a Shopee
 * Com foco no redirecionamento correto para o Seller Centre
 */
import { createHmac } from 'crypto';
import { ShopeeAuthConfig } from './types';

/**
 * Gera URLs de autorização para conectar lojas Shopee
 * Implementa a abordagem correta conforme documentação atual
 */
export function generateAuthUrls(config: ShopeeAuthConfig) {
  // Gerar timestamp em segundos (unix timestamp)
  const timestamp = Math.floor(Date.now() / 1000);

  // Criar estado único para CSRF protection
  const stateParam = `cipshopee_${Date.now()}`;

  // Verificar se a URL de redirecionamento está definida
  if (!config.redirectUrl) {
    throw new Error('URL de redirecionamento não definida na configuração');
  }

  // URL BASE para o fluxo de autorização de loja
  const baseUrl = 'https://partner.shopeemobile.com';
  const apiPath = '/api/v2/shop/auth_partner';

  // ===== Método padrão usando a URL de autorização oficial =====
  // String base para gerar assinatura
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;

  // Gerar assinatura HMAC-SHA256
  const hmac = createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');

  // Construir URL de autorização padrão
  const standardUrl = `${baseUrl}${apiPath}?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `region=BR&` +
    `is_auth_shop=true&` +
    `login_type=seller&` +
    `auth_type=direct&` +
    `state=${stateParam}`;

  // ===== Método alternativo para login direto pelo Seller Centre =====
  // URL alternativa baseada na implementação do Seller Centre
  // Usada como fallback caso a primeira abordagem não redirecione corretamente
  const sellerBaseUrl = 'https://seller.shopee.com.br';
  const sellerApiPath = '/api/v2/shop/auth_partner';

  // Gerar assinatura para o método alternativo
  const sellerBaseString = `${config.partnerId}${sellerApiPath}${timestamp}`;
  const sellerHmac = createHmac('sha256', config.partnerKey);
  sellerHmac.update(sellerBaseString);
  const sellerSignature = sellerHmac.digest('hex');

  // Construir URL alternativa
  const alternativeUrl = `${sellerBaseUrl}${sellerApiPath}?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${sellerSignature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}`;

  // ===== Método direto via Account Seller Shopee =====
  // Este método usa o domínio account.seller.shopee.com que direciona diretamente para o login de vendedor
  const accountSellerBaseUrl = 'https://account.seller.shopee.com';
  const loginPath = '/seller/login';

  // String base específica para o login direto
  const accountBaseString = `${config.partnerId}timestamp${timestamp}redirect_uri${config.redirectUrl}`;
  const accountHmac = createHmac('sha256', config.partnerKey);
  accountHmac.update(accountBaseString);
  const accountSignature = accountHmac.digest('hex');

  // URL para login direto como vendedor
  const directSellerLoginUrl = `${accountSellerBaseUrl}${loginPath}?` +
    `client_id=${config.partnerId}&` +
    `redirect_uri=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}&` +
    `scope=profile&` +
    `lang=pt-br&` +
    `timestamp=${timestamp}&` +
    `sign=${accountSignature}`;

  return {
    standardUrl,
    alternativeUrl,
    directSellerLoginUrl
  };
}

/**
 * Gera uma página de diagnóstico HTML com todas as opções de autorização
 * para facilitar a depuração e testes
 */
export function generateDiagnosticPage(urls: {
  standardUrl: string;
  alternativeUrl: string;
  directSellerLoginUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnóstico de Autorização Shopee</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #ee4d2d;
      border-bottom: 2px solid #ee4d2d;
      padding-bottom: 10px;
    }
    h2 {
      color: #ee4d2d;
      margin-top: 30px;
    }
    .url-box {
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      background-color: #ee4d2d;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    .btn:hover {
      background-color: #d33d1f;
    }
    .tip {
      background-color: #fff8e1;
      padding: 10px;
      border-left: 4px solid #ffb300;
      margin: 20px 0;
    }
    code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <h1>Diagnóstico de Autorização Shopee</h1>

  <div class="tip">
    <p><strong>Dica:</strong> Se você enfrentar problemas de redirecionamento, tente cada um dos métodos abaixo. 
    O método recomendado é o primeiro, mas dependendo da configuração da sua conta e região, outros métodos podem funcionar melhor.</p>
  </div>

  <h2>1. Método Padrão (partner.shopeemobile.com)</h2>
  <p>Este é o método padrão usando a API oficial de parceiros.</p>
  <div class="url-box">
    ${urls.standardUrl}
  </div>
  <a href="${urls.standardUrl}" target="_blank" class="btn">Conectar com Método Padrão</a>

  <h2>2. Método Alternativo (seller.shopee.com.br)</h2>
  <p>Usar o domínio regional do Seller Center pode ajudar com problemas de redirecionamento.</p>
  <div class="url-box">
    ${urls.alternativeUrl}
  </div>
  <a href="${urls.alternativeUrl}" target="_blank" class="btn">Conectar com Método Alternativo</a>

  <h2>3. Login Direto como Vendedor (account.seller.shopee.com)</h2>
  <p>Este método direciona para a página de login de vendedor diretamente, evitando a página de desenvolvedor.</p>
  <div class="url-box">
    ${urls.directSellerLoginUrl}
  </div>
  <a href="${urls.directSellerLoginUrl}" target="_blank" class="btn">Conectar via Login de Vendedor</a>

  <div class="tip">
    <p><strong>Instrução para desenvolvedores:</strong> Se um dos métodos funcionar melhor, atualize a implementação da sua aplicação para usar esse método específico.</p>
  </div>
</body>
</html>
  `;
}