
/**
 * Rotas para testar webhooks em desenvolvimento
 */
import { Router, Request, Response } from 'express';
import { webhookTests } from '../shopee/webhookTest';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Página de teste de webhook
 */
router.get('/test', isAuthenticated, (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Teste de Webhooks Shopee</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            button { padding: 10px 15px; margin: 5px; background: #ee4d2d; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #d73419; }
            .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        </style>
    </head>
    <body>
        <h1>Teste de Webhooks Shopee</h1>
        <p>Use os botões abaixo para testar diferentes tipos de webhook:</p>
        
        <button onclick="testWebhook('connection')">Teste de Conexão</button>
        <button onclick="testWebhook('authorization')">Autorização de Loja</button>
        <button onclick="testWebhook('order')">Atualização de Pedido</button>
        <button onclick="testWebhook('deauthorization')">Desautorização</button>
        
        <div id="result"></div>
        
        <script>
            async function testWebhook(type) {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<p>Enviando webhook...</p>';
                
                try {
                    const response = await fetch('/api/test/webhook/' + type, {
                        method: 'POST'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = '<div class="result success"><h3>Sucesso!</h3><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
                    } else {
                        resultDiv.innerHTML = '<div class="result error"><h3>Erro!</h3><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
                    }
                } catch (error) {
                    resultDiv.innerHTML = '<div class="result error"><h3>Erro de rede!</h3><p>' + error.message + '</p></div>';
                }
            }
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

/**
 * Endpoints para executar testes
 */
router.post('/webhook/connection', async (req: Request, res: Response) => {
  try {
    const result = await webhookTests.testConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhook/authorization', async (req: Request, res: Response) => {
  try {
    const result = await webhookTests.testShopAuthorization(404065079);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhook/order', async (req: Request, res: Response) => {
  try {
    const result = await webhookTests.testOrderUpdate(404065079);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhook/deauthorization', async (req: Request, res: Response) => {
  try {
    const result = await webhookTests.testShopDeauthorization(404065079);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
