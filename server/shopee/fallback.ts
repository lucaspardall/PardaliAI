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

  // Log detalhado para debug
  console.log(`===================================================`);
  console.log(`[Shopee Auth] Gerando URL de autorização`);
  console.log(`[Shopee Auth] Partner ID: ${config.partnerId}`);
  console.log(`[Shopee Auth] Região: ${config.region}`);
  console.log(`[Shopee Auth] URL de Redirecionamento: ${config.redirectUrl}`);
  console.log(`[Shopee Auth] Timestamp: ${timestamp}`);

  // ===== Método padrão usando a URL de autorização oficial =====
  // String base para gerar assinatura - EXATAMENTE conforme documentação oficial
  // String base: partner_id + api_path + timestamp
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;
  console.log(`[Shopee Auth] String base para assinatura: ${baseString}`);

  // Gerar assinatura HMAC-SHA256
  const hmac = createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');
  console.log(`[Shopee Auth] Assinatura gerada: ${signature}`);

  // Construir URL de autorização padrão EXATAMENTE conforme documentação
  // Apenas os parâmetros oficiais e obrigatórios: partner_id, timestamp, sign, redirect
  // Os parâmetros opcionais são adicionados após, mas não são usados na assinatura
  const standardUrl = `${baseUrl}${apiPath}?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}`;

  // URL padrão melhorada com parâmetros adicionais para direcionamento ao Seller Center
  // Estes parâmetros não fazem parte da assinatura, mas ajudam no fluxo de login
  const enhancedStandardUrl = `${standardUrl}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `login_type=seller&` +
    `auth_type=direct`;

  // ===== Método alternativo - URL simplificada com parâmetros mínimos =====
  // Apenas os parâmetros essenciais para testar se há problema com os parâmetros adicionais
  const minimalUrl = `${baseUrl}${apiPath}?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}`;

  // ===== Método alternativo para login direto pelo Seller Centre =====
  // URL alternativa baseada na implementação do Seller Centre regional
  const sellerBaseUrl = 'https://seller.shopee.com.br';
  const sellerApiPath = '/api/v2/shop/auth_partner';

  // Mesmo princípio de assinatura que o método padrão
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
  // Este método direciona para o login de vendedor diretamente
  const accountSellerBaseUrl = 'https://account.seller.shopee.com.br';
  const loginPath = '/seller/login';

  // String base específica para o login direto
  // No formato specifico para este endpoint específico
  const accountBaseString = `${config.partnerId}${loginPath}${timestamp}`;
  const accountHmac = createHmac('sha256', config.partnerKey);
  accountHmac.update(accountBaseString);
  const accountSignature = accountHmac.digest('hex');

  // URL para login direto como vendedor
  const directSellerLoginUrl = `${accountSellerBaseUrl}${loginPath}?` +
    `partner_id=${config.partnerId}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}&` +
    `timestamp=${timestamp}&` +
    `sign=${accountSignature}`;

  // Log das URLs geradas (parcialmente, para não poluir o log)
  console.log(`[Shopee Auth] URL padrão: ${standardUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL padrão melhorada: ${enhancedStandardUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL minimalista: ${minimalUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL alternativa: ${alternativeUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL login direto: ${directSellerLoginUrl.substring(0, 100)}...`);
  console.log(`===================================================`);

  return {
    standardUrl: enhancedStandardUrl, // URL melhorada como padrão
    minimalUrl: minimalUrl,           // URL com parâmetros mínimos
    alternativeUrl,                   // URL usando domínio regional
    directSellerLoginUrl              // URL para login direto
  };
}

/**
 * Gera uma página de diagnóstico HTML com todas as opções de autorização
 * para facilitar a depuração e testes
 */
export function generateDiagnosticPage(urls: {
  standardUrl: string;
  minimalUrl: string;
  alternativeUrl: string;
  directSellerLoginUrl: string;
}) {
  // Data e hora atual para referência
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);
  const formattedTime = now.toLocaleString('pt-BR');
  
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
      max-height: 80px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
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
    .btn-primary {
      background-color: #ee4d2d;
    }
    .btn-secondary {
      background-color: #6c757d;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .tip {
      background-color: #fff8e1;
      padding: 10px;
      border-left: 4px solid #ffb300;
      margin: 20px 0;
    }
    .debug {
      background-color: #e3f2fd;
      padding: 10px;
      border-left: 4px solid #2196F3;
      margin: 20px 0;
      font-size: 12px;
    }
    code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .info {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    .header-info {
      font-size: 12px;
      color: #666;
      text-align: right;
      margin-top: -30px;
    }
  </style>
</head>
<body>
  <h1>Diagnóstico de Autorização Shopee</h1>
  <div class="header-info">Gerado em: ${formattedTime} (${timestamp})</div>

  <div class="tip">
    <p><strong>Dica:</strong> Se você enfrentar problemas de redirecionamento, tente cada um dos métodos abaixo. 
    Se um método funcionar melhor que os outros, faça uma anotação e atualize a implementação do seu aplicativo.</p>
  </div>

  <h2>1. Método Padrão Aprimorado</h2>
  <p class="info">Este é o método recomendado, que utiliza o domínio oficial da API de parceiros com todos os parâmetros para direcionar corretamente ao Seller Center.</p>
  <div class="url-box">
    ${urls.standardUrl}
  </div>
  <a href="${urls.standardUrl}" target="_blank" class="btn btn-primary">Conectar com Método Padrão</a>

  <h2>2. Método Minimalista</h2>
  <p class="info">Utiliza apenas os parâmetros essenciais exigidos pela documentação oficial. Útil para testar se algum parâmetro extra está causando problemas.</p>
  <div class="url-box">
    ${urls.minimalUrl}
  </div>
  <a href="${urls.minimalUrl}" target="_blank" class="btn btn-secondary">Testar Método Minimalista</a>

  <h2>3. Método Regional (seller.shopee.com.br)</h2>
  <p class="info">Utiliza o domínio regional do Seller Center, o que pode ajudar com problemas de redirecionamento específicos para a região do Brasil.</p>
  <div class="url-box">
    ${urls.alternativeUrl}
  </div>
  <a href="${urls.alternativeUrl}" target="_blank" class="btn btn-secondary">Testar Método Regional</a>

  <h2>4. Login Direto como Vendedor</h2>
  <p class="info">Este método direciona para a página de login do vendedor diretamente, contornando a camada de autorização de API/desenvolvedor.</p>
  <div class="url-box">
    ${urls.directSellerLoginUrl}
  </div>
  <a href="${urls.directSellerLoginUrl}" target="_blank" class="btn btn-primary">Conectar via Login Direto</a>

  <div class="debug">
    <p><strong>Informações para depuração:</strong></p>
    <ul>
      <li><strong>Timestamp:</strong> ${timestamp}</li>
      <li><strong>Chaves de assinatura:</strong> O formato da string base para geração de assinatura (sign) deve seguir o formato especificado na documentação oficial: <code>partner_id + api_path + timestamp</code></li>
      <li><strong>URL de callback:</strong> Certifique-se de que a URL de callback configurada no painel de desenvolvedores da Shopee corresponde exatamente à URL usada aqui</li>
      <li><strong>HTTPS:</strong> A URL de callback deve usar HTTPS</li>
    </ul>
  </div>

  <div class="tip">
    <p><strong>Se nenhum método funcionar:</strong> Verifique sua conta na plataforma Shopee para garantir que as configurações de desenvolvedor estão corretas e que você tem as permissões necessárias.</p>
  </div>
</body>
</html>
  `;
}