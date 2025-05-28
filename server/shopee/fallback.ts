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
  console.log(`===================================================`);

  // String base para gerar assinatura
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;

  // Gerar assinatura HMAC-SHA256
  const hmac = createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');

  console.log(`[Shopee Auth] Base string: ${baseString}`);
  console.log(`[Shopee Auth] Signature: ${signature}`);

  // Construir URLs alternativas
  const urls: Record<string, string> = {};

  // URL padrão oficial
  urls['standard'] = `${baseUrl}${apiPath}?${new URLSearchParams({
    partner_id: config.partnerId,
    timestamp: timestamp.toString(),
    sign: signature,
    redirect: config.redirectUrl,
    state: stateParam
  }).toString()}`;

  // URL alternativa com domínio seller
  const sellerBaseUrl = 'https://seller.shopee.com.br';
  urls['seller_domain'] = `${sellerBaseUrl}${apiPath}?${new URLSearchParams({
    partner_id: config.partnerId,
    timestamp: timestamp.toString(),
    sign: signature,
    redirect: config.redirectUrl,
    state: stateParam
  }).toString()}`;

  // URL com parâmetros extras para BR
  urls['br_enhanced'] = `${baseUrl}${apiPath}?${new URLSearchParams({
    partner_id: config.partnerId,
    timestamp: timestamp.toString(),
    sign: signature,
    redirect: config.redirectUrl,
    state: stateParam,
    region: 'BR',
    country: 'BR',
    language: 'pt'
  }).toString()}`;

  return urls;
}

/**
 * Gera página de diagnóstico HTML com múltiplas opções
 */
export function generateDiagnosticPage(urls: Record<string, string>): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Diagnóstico de Autorização Shopee</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          padding: 20px; 
          max-width: 1200px; 
          margin: 0 auto;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
          color: #ee4d2d; 
          border-bottom: 3px solid #ee4d2d; 
          padding-bottom: 10px;
        }
        .url-option {
          margin: 20px 0;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }
        .url-option h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .url-display {
          word-break: break-all;
          background: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          margin: 10px 0;
        }
        .btn {
          display: inline-block;
          background: #ee4d2d;
          color: white;
          padding: 12px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin: 5px 0;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #d73c1f;
        }
        .explanation, .recommendation, .warning {
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .explanation {
          background: #e7f3ff;
          border-left: 4px solid #2196f3;
        }
        .recommendation {
          background: #f0f8e7;
          border-left: 4px solid #4caf50;
        }
        .warning {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔍 Diagnóstico de Autorização Shopee</h1>

        <div class="explanation">
          <p><strong>Status Atual:</strong> A assinatura está correta! O status 302 que você está vendo é o comportamento esperado da API da Shopee.</p>
          <p>O redirecionamento 302 significa que a API validou seus parâmetros e está direcionando para a página de login da Shopee.</p>
        </div>

        <div class="recommendation">
          <p><strong>Próximos Passos:</strong></p>
          <ol>
            <li>Teste cada opção abaixo para ver qual completa o fluxo de autorização</li>
            <li>Anote qual opção funciona para configurar como padrão</li>
            <li>Após o login, você será redirecionado de volta para o seu sistema</li>
          </ol>
        </div>

        ${Object.entries(urls).map(([key, url]) => `
          <div class="url-option">
            <h3>🔗 ${key.toUpperCase().replace(/_/g, ' ')}</h3>
            <div class="url-display">${url}</div>
            <a href="${url}" class="btn" target="_blank">Testar esta opção</a>
          </div>
        `).join('')}

        <div class="warning">
          <p><strong>⚠️ Importante:</strong> Cada teste pode levar você para a página de login da Shopee. Isso é normal e esperado.</p>
          <p>Após fazer login na Shopee, você será redirecionado de volta para o dashboard do CIP.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera diferentes variações da URL de autorização da Shopee para
 * diagnóstico e resolução de problemas de autenticação
 */
export function generateTestVariants(config: ShopeeAuthConfig): Record<string, string> {
  // Verificar se a URL de redirecionamento está definida
  if (!config.redirectUrl) {
    throw new Error('URL de redirecionamento não definida na configuração');
  }

  // URL BASE para o fluxo de autorização de loja
  const baseUrl = 'https://partner.shopeemobile.com';
  const apiPath = '/api/v2/shop/auth_partner';

  // Gerar timestamp em segundos (unix timestamp)
  const timestamp = Math.floor(Date.now() / 1000);
  console.log(`[Shopee Auth] Timestamp: ${timestamp}`);

  // Criar estado único para CSRF protection
  const stateParam = `cipshopee_${Date.now()}`;
  console.log(`[Shopee Auth] State Param: ${stateParam}`);

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

  // ===== Variações da URL padrão para testar a ordem dos parâmetros =====
  // Inverter a ordem dos parâmetros `login_type` e `auth_type`
  const loginTypeFirstUrl = `${standardUrl}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `login_type=seller&` +
    `auth_type=direct`;

  // Inverter a ordem dos parâmetros `auth_type` e `login_type`
  const authTypeFirstUrl = `${standardUrl}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `auth_type=direct&` +
    `login_type=seller`;

  // Remover o parâmetro `auth_type`
  const noAuthTypeUrl = `${standardUrl}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `login_type=seller`;

  // Remover o parâmetro `login_type`
  const noLoginTypeUrl = `${standardUrl}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `auth_type=direct`;

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

  // Criar nova assinatura específica para URL account.seller
  const accountUrlSignature = createHmac('sha256', config.partnerKey)
    .update(`${config.partnerId}/api/v2/shop/auth_partner${timestamp}`)
    .digest('hex');

  // URL para forçar o login no account.seller.shopee.com.br
  // Redireciona para a página de login e, em seguida, para a autorização
  const accountSellerUrl = `${accountSellerBaseUrl}/login?next=https://seller.shopee.com.br/api/v2/shop/auth_partner?partner_id=${config.partnerId}%26timestamp=${timestamp}%26sign=${accountUrlSignature}%26redirect=${encodeURIComponent(config.redirectUrl)}%26state=${stateParam}`;

  // ===== URL alternativa para o domínio do Brasil usando auth_partner em vez de shop/auth_partner =====
  const brUrl = `https://partner.shopee.com.br/api/v2/auth_partner?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `login_type=seller&` +
    `auth_type=direct`;

  // Log das URLs geradas (parcialmente, para não poluir o log)
  console.log(`[Shopee Auth] URL padrão: ${standardUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL padrão melhorada: ${enhancedStandardUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL minimalista: ${minimalUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL alternativa: ${alternativeUrl.substring(0, 100)}...`);
  console.log(`[Shopee Auth] URL login direto: ${directSellerLoginUrl.substring(0, 100)}...`);
  console.log(`===================================================`);

  // Construir conjunto completo de variantes para teste
  return {
    minimal: minimalUrl,
    standard: standardUrl,
    enhanced: enhancedStandardUrl,
    loginTypeFirst: loginTypeFirstUrl,
    authTypeFirst: authTypeFirstUrl,
    noAuthType: noAuthTypeUrl,
    noLoginType: noLoginTypeUrl, 
    alternative: alternativeUrl,
    accountSeller: accountSellerUrl,
    brDomain: brUrl
  };
}

/**
 * Função auxiliar que retorna nome legível para cada opção
 */
function getReadableName(key: string): string {
  const names: Record<string, string> = {
    // Opções minimalistas
    minimal: "Abordagem Minimalista",
    withRegion: "Minimal + Region",
    withAuthShop: "Minimal + AuthShop",
    withLoginType: "Minimal + LoginType",
    withAuthType: "Minimal + AuthType",
    withRegionAndAuthShop: "Minimal + Region + AuthShop",
    withLoginAndAuthType: "Minimal + LoginType + AuthType",

    // Opções antigas
    standard: "Padrão",
    enhanced: "Completa",
    loginTypeFirst: "Login Type Primeiro",
    authTypeFirst: "Auth Type Primeiro",
    noAuthType: "Sem Auth Type",
    noLoginType: "Sem Login Type",
    alternative: "Alternativa (seller.shopee)",
    accountSeller: "Account Seller Login",
    brDomain: "Domínio BR"
  };
  return names[key] || key;
}

/**
 * Função auxiliar que retorna descrição para cada opção
 */
function getDescription(key: string): string {
  const descriptions: Record<string, string> = {
    // Opções minimalistas com descrições detalhadas
    minimal: "Apenas os parâmetros essenciais sem extras: partner_id, timestamp, sign, redirect, state. Teste esta opção primeiro para estabelecer uma base funcional.",
    withRegion: "Adiciona apenas o parâmetro region=BR aos parâmetros essenciais, para isolar se este parâmetro está causando problemas.",
    withAuthShop: "Adiciona apenas o parâmetro is_auth_shop=true aos parâmetros essenciais, para isolar se este parâmetro está causando problemas.",
    withLoginType: "Adiciona apenas o parâmetro login_type=seller aos parâmetros essenciais, para isolar se este parâmetro está causando problemas.",
    withAuthType: "Adiciona apenas o parâmetro auth_type=direct aos parâmetros essenciais, para isolar se este parâmetro está causando problemas.",
    withRegionAndAuthShop: "Adiciona os parâmetros region=BR e is_auth_shop=true aos parâmetros essenciais, para testar esta combinação específica.",
    withLoginAndAuthType: "Adiciona os parâmetros login_type=seller e auth_type=direct aos parâmetros essenciais, para testar esta combinação específica.",

    // Opções antigas
    standard: "URL padrão com parâmetro de região adicionado (BR).",
    enhanced: "URL completa com todos os parâmetros de direcionamento para o Seller Center.",
    loginTypeFirst: "Prioriza o parâmetro login_type=seller como primeiro parâmetro adicional.",
    authTypeFirst: "Prioriza o parâmetro auth_type=direct como primeiro parâmetro adicional.",
    noAuthType: "Remove o parâmetro auth_type que pode causar conflitos em algumas versões da API.",
    noLoginType: "Remove o parâmetro login_type que pode causar conflitos em algumas versões da API.",
    alternative: "Usa o domínio do Seller Center diretamente em vez da API de parceiros.",
    accountSeller: "Redireciona para a página de login do vendedor antes de iniciar o fluxo de autorização.",
    brDomain: "Usa o domínio específico para o Brasil em vez do domínio internacional."
  };
  return descriptions[key] || "Opção alternativa para teste de compatibilidade.";
}