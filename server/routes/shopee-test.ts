/**
 * Rota de teste para integração com a Shopee sem necessidade de autenticação
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';

const router = Router();

/**
 * Teste de fluxo de autenticação da Shopee
 * Rota acessível sem autenticação
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log("======= TESTE DE INTEGRAÇÃO SHOPEE (SEM AUTENTICAÇÃO) =======");
    console.log("Ambiente:", process.env.NODE_ENV);
    console.log("Informações de configuração da API:");
    console.log("Partner ID:", process.env.SHOPEE_PARTNER_ID);
    console.log("URL de redirecionamento configurada:", process.env.SHOPEE_REDIRECT_URL);
    console.log("===================================================");

    // Gerar URLs de autorização com ambas as abordagens
    // 1. Abordagem padrão com partner.shopeemobile.com
    const clientId = process.env.SHOPEE_PARTNER_ID || '2011285';
    const clientSecret = process.env.SHOPEE_PARTNER_KEY || '';
    const redirectUri = 'https://cipshopee.replit.app/api/shopee/callback';
    const timestamp = Math.floor(Date.now() / 1000);
    const state = `cipshopee_${Date.now()}`;
    
    // 1.1 URL de autorização padrão (API Partner)
    // String base para API Partner (partner_id + API_path + timestamp)
    const apiPath = '/api/v2/shop/auth_partner';
    const baseString1 = `${clientId}${apiPath}${timestamp}`;
    const hmac1 = crypto.createHmac('sha256', clientSecret);
    hmac1.update(baseString1);
    const signature1 = hmac1.digest('hex');
    
    const standardUrl = `https://partner.shopeemobile.com${apiPath}?` +
                    `partner_id=${clientId}&` +
                    `timestamp=${timestamp}&` +
                    `sign=${signature1}&` +
                    `redirect=${encodeURIComponent(redirectUri)}&` +
                    `state=${encodeURIComponent(state)}&` +
                    `region=BR&` +
                    `is_auth_shop=true&` +
                    `login_type=seller&` +
                    `auth_type=direct`;
    
    // 1.2 URL alternativa (Seller Account)
    // String base para assinatura conforme formato descoberto no outro SaaS
    const baseString2 = `${clientId}timestamp${timestamp}redirect_uri${redirectUri}`;
    const hmac2 = crypto.createHmac('sha256', clientSecret);
    hmac2.update(baseString2);
    const signature2 = hmac2.digest('hex');
    
    const alternativeUrl = `https://account.seller.shopee.com/signin/oauth/accountchooser?` +
                  `client_id=${clientId}&` +
                  `lang=pt-br&` +
                  `login_types=%5B1,4,2%5D&` +
                  `max_auth_age=3600&` +
                  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                  `region=SG&` +
                  `required_passwd=true&` +
                  `respond_code=code&` +
                  `scope=profile&` +
                  `sign=${signature2}&` +
                  `timestamp=${timestamp}&` +
                  `state=${encodeURIComponent(state)}`;
    
    // 2. Detalhes para diagnóstico
    console.log("✅ URL padrão (Partner API):", standardUrl);
    console.log("✅ URL alternativa (Seller Account):", alternativeUrl);

    // Salvar URLs em arquivo para inspeção e debug
    try {
      fs.writeFileSync('shopee_auth_url.txt', 
        `URL Padrão: ${standardUrl}\n\nURL Alternativa: ${alternativeUrl}`);
      console.log("✅ URLs salvas em arquivo para inspeção: shopee_auth_url.txt");
    } catch (err) {
      console.error("Não foi possível salvar URLs em arquivo:", err);
    }
    
    // Interface HTML para testar ambos os métodos
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teste de Integração Shopee</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, sans-serif;
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
            <h1>Teste de Integração Shopee</h1>
            <p>Esta página permite testar diferentes abordagens de integração com a API da Shopee.</p>
          </div>
          
          <div class="card">
            <div class="warning">
              <strong>Importante:</strong> Esta página não requer login e é destinada apenas para testes de integração.
            </div>
            
            <div class="tab">
              <button class="tablinks active" onclick="openTab(event, 'tab1')">Método API Parceiro</button>
              <button class="tablinks" onclick="openTab(event, 'tab2')">Método Vendedor</button>
              <button class="tablinks" onclick="openTab(event, 'tab3')">Diagnóstico</button>
            </div>
            
            <div id="tab1" class="tabcontent visible">
              <h2>1. API de Parceiro (partner.shopeemobile.com)</h2>
              <p>Esta é a abordagem padrão conforme documentação da Shopee API v2 para parceiros.</p>
              
              <div class="info">
                <p>Detalhes da assinatura:</p>
                <ul>
                  <li>String base: <code>${clientId}${apiPath}${timestamp}</code></li>
                  <li>Formato: partner_id + API_path + timestamp</li>
                </ul>
              </div>
              
              <h3>URL de Autorização:</h3>
              <pre>${standardUrl}</pre>
              
              <a href="${standardUrl}" class="btn" target="_blank">Testar API de Parceiro</a>
            </div>
            
            <div id="tab2" class="tabcontent">
              <h2>2. Autenticação de Vendedor (account.seller.shopee.com)</h2>
              <p>Esta abordagem utiliza o portal de vendedores da Shopee.</p>
              
              <div class="info">
                <p>Detalhes da assinatura:</p>
                <ul>
                  <li>String base: <code>${clientId}timestamp${timestamp}redirect_uri${redirectUri}</code></li>
                  <li>Formato: client_id + "timestamp" + timestamp + "redirect_uri" + redirect_uri</li>
                </ul>
              </div>
              
              <h3>URL de Autorização:</h3>
              <pre>${alternativeUrl}</pre>
              
              <a href="${alternativeUrl}" class="btn btn-alt" target="_blank">Testar Conta de Vendedor</a>
            </div>
            
            <div id="tab3" class="tabcontent">
              <h2>Diagnóstico e Solução de Problemas</h2>
              
              <div class="info">
                <p><strong>Erro comum:</strong> "The requested client was not found on this server"</p>
                <p>Este erro geralmente indica que o Partner ID/Client ID não está registrado corretamente
                ou não está ativo na Shopee Open Platform.</p>
              </div>
              
              <h3>Possíveis Causas:</h3>
              <ul>
                <li>Partner ID não registrado ou ativo na Shopee Open Platform</li>
                <li>O aplicativo não está aprovado ou está em modo sandbox</li>
                <li>A URL de redirecionamento configurada não corresponde à registrada na plataforma</li>
                <li>Região incorreta (BR vs SG vs outro)</li>
                <li>Assinatura sendo gerada com formato incorreto</li>
              </ul>
              
              <h3>Configuração Atual:</h3>
              <ul>
                <li>Partner ID: <code>${clientId}</code></li>
                <li>Timestamp: <code>${timestamp}</code></li>
                <li>URL de Redirecionamento: <code>${redirectUri}</code></li>
                <li>Ambiente: <code>${process.env.NODE_ENV || 'development'}</code></li>
              </ul>
            </div>
          </div>
          
          <div class="card">
            <h2>Voltar para o aplicativo</h2>
            <a href="/" class="btn" style="background:#666">Voltar para a página inicial</a>
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
    
    return res.send(htmlContent);

  } catch (error: any) {
    console.error('Erro no teste de integração Shopee:', error);
    res.status(500).json({
      message: 'Falha no teste de integração Shopee',
      error: error.message
    });
  }
});

export default router;