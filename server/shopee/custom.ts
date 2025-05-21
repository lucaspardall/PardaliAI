/**
 * Solução customizada para autorização Shopee baseada em pesquisas online
 * 
 * Esta implementação usa uma URL de login direto do vendedor Shopee
 * baseada em soluções encontradas em diversos fóruns e documentações
 */

import { createHmac } from 'crypto';

/**
 * Interface para configuração da API Shopee
 */
interface ShopeeConfig {
  partnerId: string;
  partnerKey: string;
  redirectUrl: string;
}

/**
 * Gera URL para teste da API Shopee usando diferentes abordagens
 * encontradas em soluções online e documentações
 */
export function generateTestUrls(config: ShopeeConfig): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const state = `cipshopee_${Date.now()}`;
  
  // SOLUÇÃO 1: URL direto para login de parceiros baseada na documentação
  // Domínio: open.shopee.com (usado por algumas integrações)
  const sign1 = createHmac('sha256', config.partnerKey)
    .update(`${config.partnerId}/api/v2/shop/auth_partner${timestamp}`)
    .digest('hex');
  
  const url1 = `https://open.shopee.com/api/v2/shop/auth_partner?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${sign1}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${state}`;
  
  // SOLUÇÃO 2: URL alternativa com subdomínio específico do país
  // Alguns países têm subdomínios específicos (BR = Brasil)
  const sign2 = createHmac('sha256', config.partnerKey)
    .update(`${config.partnerId}/api/v2/shop/auth_partner${timestamp}`)
    .digest('hex');
  
  const url2 = `https://open.shopee.br/api/v2/shop/auth_partner?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${sign2}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${state}`;
  
  // SOLUÇÃO 3: Abordagem com domínio seller
  // Algumas integrações usam o portal do vendedor
  const sign3 = createHmac('sha256', config.partnerKey)
    .update(`${config.partnerId}${timestamp}`)
    .digest('hex');
  
  const url3 = `https://seller.shopee.com.br/api/v2/shop/auth_partner?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${sign3}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${state}`;
  
  // SOLUÇÃO 4: Método reduzido com poucos parâmetros
  // Alguns relatos indicam que nem todos os parâmetros são necessários
  const sign4 = createHmac('sha256', config.partnerKey)
    .update(`${config.partnerId}${timestamp}`)
    .digest('hex');
  
  const url4 = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${sign4}`;
  
  // SOLUÇÃO 5: Abordagem direta com o console de desenvolvedor
  // Alguns relatos indicam que é necessário autenticar primeiro no console
  const url5 = `https://open.shopee.com/sign/up?from=partner`;
  
  return {
    solution1: url1,
    solution2: url2, 
    solution3: url3,
    solution4: url4,
    solution5: url5
  };
}

/**
 * Gera HTML para página de diagnóstico e testes múltiplos
 */
export function generateAdvancedTestPage(config: ShopeeConfig): string {
  const urls = generateTestUrls(config);
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Testes Avançados de Integração Shopee</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 1100px;
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
        }
        h1, h2, h3 {
          margin-top: 0;
        }
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #eee;
        }
        .url-box {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
          font-size: 12px;
          margin: 10px 0;
          border: 1px solid #e0e0e0;
        }
        .solution {
          border-left: 5px solid #ee4d2d;
          padding-left: 15px;
          margin-bottom: 30px;
        }
        .btn {
          display: inline-block;
          padding: 10px 16px;
          background: #ee4d2d;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          border: none;
          font-weight: bold;
          margin-top: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #d43c1e;
        }
        .btn-alt {
          background: #1976d2;
        }
        .btn-alt:hover {
          background: #145ca4;
        }
        .btn-gray {
          background: #757575;
        }
        .btn-gray:hover {
          background: #616161;
        }
        .info {
          background: #e3f2fd;
          border-left: 5px solid #2196f3;
          padding: 15px;
          margin: 15px 0;
        }
        code {
          background: #f1f1f1;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: monospace;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .grid-item {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #eee;
        }
        .log-section {
          margin-top: 20px;
          padding: 20px;
          background: #f8f8f8;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .log-section h2 {
          margin-top: 0;
        }
        .log-entry {
          background: white;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          border-left: 4px solid #ee4d2d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Testes Avançados de Integração Shopee</h1>
        <p>Esta página contém múltiplas soluções baseadas em pesquisas avançadas para solucionar o problema de conexão com a API da Shopee.</p>
      </div>
      
      <div class="card">
        <h2>Informações de Configuração</h2>
        <div class="grid">
          <div class="grid-item">
            <h3>Partner ID</h3>
            <p><code>${config.partnerId}</code></p>
          </div>
          <div class="grid-item">
            <h3>Partner Key</h3>
            <p><code>${config.partnerKey.substring(0, 8)}...${config.partnerKey.substring(
              config.partnerKey.length - 8
            )}</code></p>
          </div>
          <div class="grid-item">
            <h3>URL de Redirecionamento</h3>
            <p><code>${config.redirectUrl}</code></p>
          </div>
          <div class="grid-item">
            <h3>Timestamp</h3>
            <p><code>${Math.floor(Date.now() / 1000)}</code></p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="info">
          <strong>Estratégia:</strong> Testar várias soluções encontradas em fóruns e documentações para resolver o erro "Client not found".
          Cada solução usa uma abordagem diferente baseada em casos bem-sucedidos reportados.
        </div>
        
        <div class="solution">
          <h3>Solução 1: Portal Central de Desenvolvedores (Open)</h3>
          <p>Esta solução usa o domínio <code>open.shopee.com</code> que é o portal central de desenvolvedores da Shopee, usado por algumas integrações bem-sucedidas.</p>
          <div class="url-box">${urls.solution1}</div>
          <a href="${urls.solution1}" target="_blank" class="btn">Testar Solução 1</a>
        </div>
        
        <div class="solution">
          <h3>Solução 2: Portal Regional Brasileiro</h3>
          <p>Esta solução usa o subdomínio específico do Brasil <code>open.shopee.br</code> que pode ser necessário para integrações no mercado brasileiro.</p>
          <div class="url-box">${urls.solution2}</div>
          <a href="${urls.solution2}" target="_blank" class="btn">Testar Solução 2</a>
        </div>
        
        <div class="solution">
          <h3>Solução 3: Portal do Vendedor Brasil</h3>
          <p>Esta solução usa o portal do vendedor <code>seller.shopee.com.br</code> que alguns relatos indicam funcionar para autenticação inicial.</p>
          <div class="url-box">${urls.solution3}</div>
          <a href="${urls.solution3}" target="_blank" class="btn">Testar Solução 3</a>
        </div>
        
        <div class="solution">
          <h3>Solução 4: Parâmetros Reduzidos</h3>
          <p>Esta solução usa apenas os parâmetros essenciais (partner_id, timestamp, sign) sem os opcionais que podem estar causando problemas.</p>
          <div class="url-box">${urls.solution4}</div>
          <a href="${urls.solution4}" target="_blank" class="btn">Testar Solução 4</a>
        </div>
        
        <div class="solution">
          <h3>Solução 5: Registro no Console de Desenvolvedores</h3>
          <p>Esta solução direciona para o cadastro/login no console de desenvolvedores, necessário para ativar o app antes de autorizar lojas.</p>
          <div class="url-box">${urls.solution5}</div>
          <a href="${urls.solution5}" target="_blank" class="btn btn-alt">Abrir Console Desenvolvedor</a>
        </div>
      </div>
      
      <div class="card">
        <h2>Recomendações e Diagnóstico</h2>
        <p>O erro "Client not found" geralmente ocorre pelos seguintes motivos:</p>
        <ol>
          <li><strong>Partner ID não registrado</strong> - É necessário registrar/criar o app na Shopee Open Platform Console</li>
          <li><strong>App não ativado</strong> - O app deve estar com status "ativo" no console de desenvolvedores</li>
          <li><strong>URL de redirecionamento não configurado</strong> - A URL de callback deve estar registrada no console</li>
          <li><strong>Região incorreta</strong> - Algumas regiões têm portais específicos para autenticação</li>
        </ol>
        
        <h3>Próximos Passos Recomendados:</h3>
        <ol>
          <li>Registrar/verificar o app no Console de Desenvolvedores da Shopee</li>
          <li>Configurar corretamente a URL de redirecionamento no console</li>
          <li>Verificar se o app está ativado (status "active")</li>
          <li>Confirmar as permissões necessárias para o app</li>
          <li>Testar com as soluções acima após realizar estas configurações</li>
        </ol>
        
        <a href="/dashboard" class="btn btn-gray">Voltar para o Dashboard</a>
      </div>
    </body>
    </html>
  `;
}