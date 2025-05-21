/**
 * Implementação alternativa para autenticação com a Shopee
 * Com base nos logs de requisição que mostraram status 302 no partner.shopeemobile.com
 */
import { createHmac } from 'crypto';
import { ShopeeAuthConfig } from './types';

/**
 * Gera URL para autenticação Shopee usando ambas as abordagens
 * @param config Configuração da Shopee
 * @returns Objeto com ambas as URLs para tentar
 */
export function generateAuthUrls(config: ShopeeAuthConfig) {
  const timestamp = Math.floor(Date.now() / 1000);
  const stateParam = `cipshopee_${Date.now()}`;
  
  // Abordagem 1: URL padrão da API parceiros conforme visto nos logs
  // Usando domain partner.shopeemobile.com conforme logs mostrados
  const baseString1 = `${config.partnerId}/api/v2/shop/auth_partner${timestamp}`;
  const hmac1 = createHmac('sha256', config.partnerKey);
  hmac1.update(baseString1);
  const signature1 = hmac1.digest('hex');
  
  const standardUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature1}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${encodeURIComponent(stateParam)}&` +
    `region=${config.region}&` +
    `is_auth_shop=true&` +
    `login_type=seller&` +
    `auth_type=direct`;
    
  // Abordagem 2: URL alternativa usando account.seller.shopee.com
  // Baseada no formato que vimos em outros sistemas como Upseller
  const baseString2 = `${config.partnerId}timestamp${timestamp}redirect_uri${config.redirectUrl}`;
  const hmac2 = createHmac('sha256', config.partnerKey);
  hmac2.update(baseString2);
  const signature2 = hmac2.digest('hex');
  
  const alternativeUrl = `https://account.seller.shopee.com/signin/oauth/accountchooser?` +
    `client_id=${config.partnerId}&` +
    `lang=pt-br&` +
    `login_types=%5B1,4,2%5D&` +
    `max_auth_age=3600&` +
    `redirect_uri=${encodeURIComponent(config.redirectUrl)}&` +
    `region=SG&` +
    `required_passwd=true&` +
    `respond_code=code&` +
    `scope=profile&` +
    `sign=${signature2}&` +
    `timestamp=${timestamp}&` +
    `state=${stateParam}`;
  
  return {
    standardUrl,
    alternativeUrl,
    timestamp,
    signature1,
    signature2,
    stateParam
  };
}

/**
 * Documentação das diferentes abordagens tentadas
 */
const DOCUMENTATION = {
  standardUrl: {
    domain: 'partner.shopeemobile.com',
    endpoint: '/api/v2/shop/auth_partner',
    parâmetros: ['partner_id', 'timestamp', 'sign', 'redirect', 'state', 'region', 'is_auth_shop', 'login_type', 'auth_type'],
    stringAssinatura: 'partner_id + endpoint + timestamp',
    detalhes: 'Abordagem padrão conforme documentação da Shopee v2. Status 302 nos logs, mas erro cliente não encontrado.'
  },
  
  alternativeUrl: {
    domain: 'account.seller.shopee.com',
    endpoint: '/signin/oauth/accountchooser',
    parâmetros: ['client_id', 'timestamp', 'sign', 'redirect_uri', 'state', 'region', 'lang', 'login_types', 'scope'],
    stringAssinatura: 'client_id + "timestamp" + timestamp + "redirect_uri" + redirect_uri',
    detalhes: 'Abordagem alternativa baseada em observações do sistema Upseller. Erro cliente não encontrado.'
  },
  
  possíveisCausas: [
    'Partner ID não registrado/ativo na Shopee Open Platform',
    'Aplicativo não aprovado ou em modo sandbox',
    'URL de redirecionamento não configurada na plataforma de desenvolvedores',
    'Assinatura sendo gerada incorretamente',
    'Região incorreta (BR vs SG vs outro)'
  ],
  
  próximosPassos: [
    'Verificar credenciais (Partner ID e Key) com a Shopee',
    'Verificar status do aplicativo na Shopee Open Platform',
    'Tentar com outras regiões (ID, MY, TH, etc)',
    'Validar URL de redirecionamento no console de desenvolvedores'
  ]
};

/**
 * Gera página HTML de diagnóstico com ambas URLs para teste
 * @param urls URLs geradas para teste
 */
export function generateDiagnosticPage(urls: ReturnType<typeof generateAuthUrls>) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Diagnóstico de Conexão Shopee</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.5;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: #f9f9f9;
          }
          .card {
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
            background: white;
          }
          .header {
            background: linear-gradient(135deg, #ff6600 0%, #ff5500 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          h1, h2, h3 {
            margin-top: 0;
          }
          .btn {
            display: inline-block;
            background: #ff5500;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 4px;
            font-weight: bold;
            text-decoration: none;
            margin-top: 10px;
            cursor: pointer;
          }
          .btn:hover {
            background: #e64a19;
          }
          .btn-alt {
            background: #2196F3;
          }
          .btn-alt:hover {
            background: #1976D2;
          }
          pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
            border: 1px solid #e0e0e0;
          }
          .tab {
            overflow: hidden;
            border: 1px solid #ccc;
            background-color: #f1f1f1;
            border-radius: 4px 4px 0 0;
          }
          .tab button {
            background-color: inherit;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 12px 16px;
            transition: 0.3s;
          }
          .tab button:hover {
            background-color: #ddd;
          }
          .tab button.active {
            background-color: white;
            border-bottom: 2px solid #ff5500;
          }
          .tabcontent {
            display: none;
            padding: 20px;
            border: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 4px 4px;
            background: white;
          }
          .visible {
            display: block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid #e0e0e0;
          }
          th, td {
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .info {
            background-color: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 15px 0;
          }
          .warning {
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Diagnóstico de Conexão Shopee</h1>
          <p>Esta página permite testar diferentes métodos de autenticação com a API da Shopee.</p>
        </div>
        
        <div class="card">
          <div class="warning">
            <strong>Importante:</strong> Para que qualquer uma dessas abordagens funcione, é necessário ter um
            Partner ID e Partner Key válidos e registrados na Shopee Open Platform.
          </div>
          
          <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'tab1')">Método Padrão API</button>
            <button class="tablinks" onclick="openTab(event, 'tab2')">Método Alternativo</button>
            <button class="tablinks" onclick="openTab(event, 'tab3')">Diagnóstico</button>
          </div>
          
          <div id="tab1" class="tabcontent visible">
            <h2>1. Método Padrão (partner.shopeemobile.com)</h2>
            <p>Esta é a abordagem padrão conforme documentação da Shopee API v2.</p>
            
            <h3>URL de Autorização:</h3>
            <pre>${urls.standardUrl}</pre>
            
            <h3>Detalhes:</h3>
            <ul>
              <li>Domínio: <code>partner.shopeemobile.com</code></li>
              <li>Endpoint: <code>/api/v2/shop/auth_partner</code></li>
              <li>Partner ID: <code>${urls.standardUrl.split('partner_id=')[1].split('&')[0]}</code></li>
              <li>Timestamp: <code>${urls.timestamp}</code></li>
              <li>Assinatura: <code>${urls.signature1}</code></li>
            </ul>
            
            <a href="${urls.standardUrl}" class="btn" target="_blank">Testar Método Padrão</a>
          </div>
          
          <div id="tab2" class="tabcontent">
            <h2>2. Método Alternativo (account.seller.shopee.com)</h2>
            <p>Esta abordagem baseia-se em observações de outras integrações funcionais com a Shopee.</p>
            
            <h3>URL de Autorização:</h3>
            <pre>${urls.alternativeUrl}</pre>
            
            <h3>Detalhes:</h3>
            <ul>
              <li>Domínio: <code>account.seller.shopee.com</code></li>
              <li>Endpoint: <code>/signin/oauth/accountchooser</code></li>
              <li>Client ID: <code>${urls.alternativeUrl.split('client_id=')[1].split('&')[0]}</code></li>
              <li>Timestamp: <code>${urls.timestamp}</code></li>
              <li>Assinatura: <code>${urls.signature2}</code></li>
              <li>Região: <code>SG</code> (Singapura)</li>
            </ul>
            
            <a href="${urls.alternativeUrl}" class="btn btn-alt" target="_blank">Testar Método Alternativo</a>
          </div>
          
          <div id="tab3" class="tabcontent">
            <h2>Diagnóstico e Troubleshooting</h2>
            
            <div class="info">
              <p><strong>Erro comum:</strong> "The requested client was not found on this server"</p>
              <p>Este erro geralmente indica que o Client ID/Partner ID não está registrado corretamente ou
              que o aplicativo não está ativo na Shopee Open Platform.</p>
            </div>
            
            <h3>Possíveis Causas:</h3>
            <ul>
              ${DOCUMENTATION.possíveisCausas.map(causa => `<li>${causa}</li>`).join('')}
            </ul>
            
            <h3>Próximos Passos:</h3>
            <ul>
              ${DOCUMENTATION.próximosPassos.map(passo => `<li>${passo}</li>`).join('')}
            </ul>
            
            <h3>Comparação das Abordagens:</h3>
            <table>
              <tr>
                <th>Característica</th>
                <th>Método Padrão</th>
                <th>Método Alternativo</th>
              </tr>
              <tr>
                <td>Domínio</td>
                <td>${DOCUMENTATION.standardUrl.domain}</td>
                <td>${DOCUMENTATION.alternativeUrl.domain}</td>
              </tr>
              <tr>
                <td>Endpoint</td>
                <td>${DOCUMENTATION.standardUrl.endpoint}</td>
                <td>${DOCUMENTATION.alternativeUrl.endpoint}</td>
              </tr>
              <tr>
                <td>ID Parameter</td>
                <td>partner_id</td>
                <td>client_id</td>
              </tr>
              <tr>
                <td>Região</td>
                <td>${urls.standardUrl.includes('region=BR') ? 'BR' : 'Não encontrado'}</td>
                <td>${urls.alternativeUrl.includes('region=SG') ? 'SG' : 'Não encontrado'}</td>
              </tr>
              <tr>
                <td>String Assinatura</td>
                <td>${DOCUMENTATION.standardUrl.stringAssinatura}</td>
                <td>${DOCUMENTATION.alternativeUrl.stringAssinatura}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div class="card">
          <h2>Logs e Informações</h2>
          <p>Timestamp atual: ${new Date().toISOString()}</p>
          <p>Partner ID: ${urls.standardUrl.split('partner_id=')[1].split('&')[0]}</p>
          <p>Estado da sessão: ${urls.stateParam}</p>
          
          <div>
            <a href="/dashboard" class="btn" style="background:#666">Voltar para o Dashboard</a>
          </div>
        </div>
        
        <script>
          function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
              tabcontent[i].classList.remove("visible");
            }
            
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
              tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            
            document.getElementById(tabName).classList.add("visible");
            evt.currentTarget.className += " active";
          }
        </script>
      </body>
    </html>
  `;
}