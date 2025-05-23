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

    const signature = createHmac('sha256', config.partnerKey)
    .update(`${config.partnerId}/api/v2/shop/auth_partner${timestamp}`)
    .digest('hex');

  // URL para forçar o login no account.seller.shopee.com.br
  // Redireciona para a página de login e, em seguida, para a autorização
  const accountSellerUrl = `${accountSellerBaseUrl}/login?next=https://seller.shopee.com.br/api/v2/shop/auth_partner?partner_id=${config.partnerId}%26timestamp=${timestamp}%26sign=${signature}%26redirect=${encodeURIComponent(config.redirectUrl)}%26state=${stateParam}`;

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
 * Gera uma página HTML de diagnóstico com múltiplas opções de autenticação
 * para testar qual abordagem funciona melhor
 */
export function generateDiagnosticPage(urls: Record<string, string>): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Diagnóstico de Conexão Shopee</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 { color: #ee4d2d; }
        h2 { 
          color: #333;
          margin-top: 30px;
        }
        .urls {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .url-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: #f9f9f9;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .url-card h3 {
          margin-top: 0;
          color: #ee4d2d;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .url-card p {
          margin-bottom: 15px;
          flex: 1;
        }
        .url-link {
          display: inline-block;
          background: #ee4d2d;
          color: white;
          padding: 10px 15px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          text-align: center;
        }
        .url-details {
          margin-top: 10px;
          font-size: 13px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .explanation {
          background: #f5f5f5;
          border-left: 4px solid #ee4d2d;
          padding: 15px;
          margin-bottom: 20px;
        }
        .warning {
          background: #fff8e1;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
    </head>
    <body>
      <h1>Diagnóstico de Conexão Shopee</h1>

      <div class="explanation">
        <p>Esta página contém múltiplas opções para autorização da Shopee. Cada botão representa uma abordagem diferente de conexão. Teste cada uma até descobrir qual funciona melhor para o seu caso.</p>
        <p><strong>Importante:</strong> Registre qual opção funciona corretamente para que possamos melhorar o processo de integração.</p>
      </div>

      <div class="warning">
        <p><strong>Atenção:</strong> Ao usar estas opções, você será redirecionado para o processo de autorização da Shopee. Este é um passo necessário para conectar sua conta. Após autorização, você retornará automaticamente a esta aplicação.</p>
      </div>

      <h2>Opções de Conexão</h2>

      <div class="urls">
        ${Object.entries(urls).map(([key, url]) => `
          <div class="url-card">
            <h3>Opção: ${getReadableName(key)}</h3>
            <p>${getDescription(key)}</p>
            <a href="${url}" class="url-link">Testar Esta Conexão</a>
            <div class="url-details" title="${url}">URL: ${url.substring(0, 50)}...</div>
          </div>
        `).join('')}
      </div>

      <h2>Comparação das Abordagens</h2>

      <table>
        <tr>
          <th>Opção</th>
          <th>Parâmetros</th>
          <th>Quando Usar</th>
        </tr>
        <tr>
          <td>Mínima</td>
          <td>partner_id, timestamp, sign, redirect, state</td>
          <td>Para isolar problemas com parâmetros extras</td>
        </tr>
        <tr>
          <td>Padrão</td>
          <td>Mínima + region</td>
          <td>Para compatibilidade básica</td>
        </tr>
        <tr>
          <td>Completa</td>
          <td>Padrão + is_auth_shop, login_type, auth_type</td>
          <td>Para direcionar ao login do vendedor</td>
        </tr>
        <tr>
          <td>Login Type Primeiro</td>
          <td>Mesmos parâmetros, ordem diferente</td>
          <td>Para sistemas sensíveis à ordem dos parâmetros</td>
        </tr>
        <tr>
          <td>Auth Type Primeiro</td>
          <td>Mesmos parâmetros, ordem diferente</td>
          <td>Para sistemas sensíveis à ordem dos parâmetros</td>
        </tr>
        <tr>
          <td>Sem Auth Type</td>
          <td>Sem o parâmetro auth_type</td>
          <td>Se auth_type causar problemas</td>
        </tr>
        <tr>
          <td>Sem Login Type</td>
          <td>Sem o parâmetro login_type</td>
          <td>Se login_type causar problemas</td>
        </tr>
        <tr>
          <td>Alternativa</td>
          <td>Domínio seller.shopee.com.br</td>
          <td>Se a URL padrão falhar</td>
        </tr>
        <tr>
          <td>Login Direto</td>
          <td>Redirecionamento via página de login</td>
          <td>Para força o login antes da autorização</td>
        </tr>
        <tr>
          <td>Domínio BR</td>
          <td>Domínio específico para o Brasil</td>
          <td>Para resolver problemas com o domínio internacional</td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Função auxiliar que retorna nome legível para cada opção
 */
function getReadableName(key: string): string {
  const names: Record<string, string> = {
    minimal: "Mínima",
    standard: "Padrão",
    enhanced: "Completa",
    loginTypeFirst: "Login Type Primeiro",
    authTypeFirst: "Auth Type Primeiro",
    noAuthType: "Sem Auth Type",
    noLoginType: "Sem Login Type",
    alternative: "Alternativa",
    accountSeller: "Login Direto",
    brDomain: "Domínio BR"
  };
  return names[key] || key;
}

/**
 * Função auxiliar que retorna descrição para cada opção
 */
function getDescription(key: string): string {
  const descriptions: Record<string, string> = {
    minimal: "Apenas parâmetros essenciais sem extras. Teste esta opção primeiro para isolar o problema.",
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