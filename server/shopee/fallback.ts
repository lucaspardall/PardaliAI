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
        .url-card.highlighted {
          border: 2px solid #ee4d2d;
          background: #fff8f0;
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
        .recommendation {
          background: #e3f2fd;
          border-left: 4px solid #2196F3;
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
        .section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-left: 8px;
          vertical-align: middle;
        }
        .badge.recommended {
          background-color: #4caf50;
          color: white;
        }
        .badge.experimental {
          background-color: #ff9800;
          color: white;
        }
      </style>
    </head>
    <body>
      <h1>Diagnóstico de Conexão Shopee</h1>

      <div class="explanation">
        <p>Esta página contém múltiplas opções para autorização da Shopee. Cada botão representa uma abordagem diferente de conexão. Teste cada uma até descobrir qual funciona melhor para o seu caso.</p>
        <p><strong>Importante:</strong> Registre qual opção funciona corretamente para que possamos melhorar o processo de integração.</p>
      </div>

      <div class="recommendation">
        <p><strong>Recomendação para Testes:</strong> Comece pela opção <strong>"Abordagem Minimalista"</strong> para estabelecer uma linha de base. Em seguida, teste as variantes com um parâmetro adicional (Minimal+Region, Minimal+AuthShop, etc.) para identificar qual parâmetro específico pode estar causando problemas.</p>
      </div>

      <div class="warning">
        <p><strong>Atenção:</strong> Ao usar estas opções, você será redirecionado para o processo de autorização da Shopee. Este é um passo necessário para conectar sua conta. Após autorização, você retornará automaticamente a esta aplicação.</p>
      </div>

      <div class="section">
        <h2>Opções Minimalistas <span class="badge recommended">RECOMENDADO</span></h2>
        <p>Estas opções usam apenas os parâmetros essenciais e adicionam um por um para identificar problemas específicos.</p>
        
        <div class="urls">
          ${Object.entries(urls)
            .filter(([key]) => ['minimal', 'withRegion', 'withAuthShop', 'withLoginType', 'withAuthType', 'withRegionAndAuthShop', 'withLoginAndAuthType'].includes(key))
            .map(([key, url]) => `
              <div class="url-card ${key === 'minimal' ? 'highlighted' : ''}">
                <h3>Teste: ${getReadableName(key)}</h3>
                <p>${getDescription(key)}</p>
                <a href="${url}" class="url-link">Testar Esta Opção</a>
                <div class="url-details" title="${url}">URL: ${url.substring(0, 50)}...</div>
              </div>
            `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Opções Alternativas <span class="badge experimental">FALLBACK</span></h2>
        <p>Estas são abordagens alternativas que tentam diferentes domínios, padrões de URL e combinações de parâmetros.</p>
        
        <div class="urls">
          ${Object.entries(urls)
            .filter(([key]) => !['minimal', 'withRegion', 'withAuthShop', 'withLoginType', 'withAuthType', 'withRegionAndAuthShop', 'withLoginAndAuthType'].includes(key))
            .map(([key, url]) => `
              <div class="url-card">
                <h3>Alternativa: ${getReadableName(key)}</h3>
                <p>${getDescription(key)}</p>
                <a href="${url}" class="url-link">Testar Esta Conexão</a>
                <div class="url-details" title="${url}">URL: ${url.substring(0, 50)}...</div>
              </div>
            `).join('')}
        </div>
      </div>

      <h2>Guia para Troubleshooting</h2>

      <table>
        <tr>
          <th>Opção</th>
          <th>Parâmetros</th>
          <th>Quando Usar</th>
        </tr>
        <tr>
          <td>Minimalista</td>
          <td>partner_id, timestamp, sign, redirect, state</td>
          <td><strong>TESTE PRIMEIRO</strong> - Para determinar se os parâmetros extras são a causa do problema</td>
        </tr>
        <tr>
          <td>Minimalista + Region</td>
          <td>Minimal + region=BR</td>
          <td>Para verificar se o parâmetro region está causando problemas</td>
        </tr>
        <tr>
          <td>Minimalista + AuthShop</td>
          <td>Minimal + is_auth_shop=true</td>
          <td>Para verificar se o parâmetro is_auth_shop está causando problemas</td>
        </tr>
        <tr>
          <td>Minimalista + LoginType</td>
          <td>Minimal + login_type=seller</td>
          <td>Para verificar se o parâmetro login_type está causando problemas</td>
        </tr>
        <tr>
          <td>Minimalista + AuthType</td>
          <td>Minimal + auth_type=direct</td>
          <td>Para verificar se o parâmetro auth_type está causando problemas</td>
        </tr>
        <tr>
          <td>Padrão</td>
          <td>Mínima + region</td>
          <td>Para compatibilidade básica com região</td>
        </tr>
        <tr>
          <td>Completa</td>
          <td>Padrão + is_auth_shop, login_type, auth_type</td>
          <td>Para direcionar ao login do vendedor (conjunto completo)</td>
        </tr>
        <tr>
          <td>Alternativa</td>
          <td>Domínio seller.shopee.com.br</td>
          <td>Se a URL padrão falhar, tenta domínio alternativo</td>
        </tr>
        <tr>
          <td>Account Seller</td>
          <td>Redirecionamento via account.seller.shopee.com.br</td>
          <td>Para forçar o login através do portal de vendedores</td>
        </tr>
      </table>

      <div class="recommendation" style="margin-top: 30px;">
        <p><strong>Próximos passos após encontrar a URL que funciona:</strong></p>
        <ol>
          <li>Anote qual variante funcionou corretamente</li>
          <li>Verifique os parâmetros específicos que foram usados</li>
          <li>Modifique a implementação principal para usar a abordagem que funcionou</li>
          <li>Certifique-se de que a autenticação está sendo feita no contexto certo (seller vs open platform)</li>
        </ol>
      </div>
    </body>
    </html>
  `;
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