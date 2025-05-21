/**
 * Rotas para autenticação e integração com a API da Shopee
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { isAuthenticated } from '../replitAuth';
import fs from 'fs';

const router = Router();

/**
 * Inicia o fluxo de autenticação OAuth com a Shopee
 */
router.get('/authorize', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log("======= INICIANDO FLUXO DE AUTORIZAÇÃO SHOPEE =======");
    console.log("Usuário autenticado:", req.user);
    console.log("Ambiente:", process.env.NODE_ENV);
    console.log("Informações de configuração da API:");
    console.log("Partner ID:", process.env.SHOPEE_PARTNER_ID);
    console.log("URL de redirecionamento configurada:", process.env.SHOPEE_REDIRECT_URL);
    console.log("===================================================");

    // Gerar timestamp e parâmetros necessários
    const timestamp = Math.floor(Date.now() / 1000);
    const partnerId = process.env.SHOPEE_PARTNER_ID || '2011285';
    const partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
    const redirectUrl = 'https://cipshopee.replit.app/api/shopee/callback';
    const state = `cipshopee_${Date.now()}`;

    // Criar a string base para assinatura EXATAMENTE conforme documentação Shopee
    const path = '/api/v2/shop/auth_partner';
    // Formato correto: [partner_id][path][timestamp]
    const baseString = `${partnerId}${path}${timestamp}`;

    console.log('String base para assinatura:', baseString);

    // Gerar a assinatura HMAC-SHA256
    const hmac = crypto.createHmac('sha256', partnerKey);
    hmac.update(baseString);
    const sign = hmac.digest('hex');

    // IMPORTANTE: Para o endpoint de autorização OAuth, precisamos usar o domínio específico da região
    // Para Brasil, o domínio correto é seller.shopee.com.br para login direto de vendedores
    const baseUrl = 'https://partner.shopeemobile.com';
    
    // Primeiro construir a URL apenas com os parâmetros obrigatórios (documentação oficial)
    // Os parâmetros obrigatórios são: partner_id, timestamp, sign e redirect
    let authUrl = `${baseUrl}${path}?` + 
      `partner_id=${partnerId}&` +
      `timestamp=${timestamp}&` +
      `sign=${sign}&` +
      `redirect=${encodeURIComponent(redirectUrl)}`;
      
    // Adicionar parâmetros adicionais para melhorar o fluxo
    authUrl += `&region=BR&is_auth_shop=true&login_type=seller&auth_type=direct`;
    
    // Adicionar log para facilitar depuração
    console.log('URL de autorização (parâmetros separados):', { 
      partner_id: partnerId,
      timestamp,
      sign,
      redirect: redirectUrl,
      region: 'BR',
      is_auth_shop: true,
      login_type: 'seller',
      auth_type: 'direct'
    });

    // Verificar se há o problema do ×tamp na URL
    if (authUrl.includes('×tamp=') || authUrl.includes('xtamp=')) {
      console.error("ERRO CRÍTICO: Caractere inválido no parâmetro timestamp!");
      // Reconstruir manualmente como último recurso (apenas parâmetros obrigatórios)
      const manualUrl = `${baseUrl}${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUrl)}`;
      console.log("URL reconstruída manualmente:", manualUrl);
      return res.redirect(manualUrl);
    }

    // Log da URL apenas para verificação
    console.log("URL final construída manualmente:", authUrl);

    // Verificar se a URL contém o parâmetro timestamp formatado corretamente
    if (!authUrl.includes('timestamp=')) {
      console.error("ERRO: Parâmetro timestamp não encontrado na URL!");
      console.log("URL problemática:", authUrl);
    }

    // Verificação e log da URL final
    console.log("URL final para autorização:", authUrl);
    
    // Verificar parâmetros obrigatórios conforme documentação oficial
    console.log("Verificação de parâmetros obrigatórios:");
    console.log("- partner_id:", authUrl.includes(`partner_id=${partnerId}`));
    console.log("- timestamp:", authUrl.includes(`timestamp=${timestamp}`));
    console.log("- sign:", authUrl.includes(`sign=${sign}`));
    console.log("- redirect:", authUrl.includes("redirect="));

    // Salvar URL em arquivo para inspeção quando necessário
    try {
      fs.writeFileSync('shopee_auth_url.txt', authUrl);
      console.log("✅ URL salva em arquivo para inspeção: shopee_auth_url.txt");
    } catch (err) {
      console.error("Não foi possível salvar URL em arquivo:", err);
    }

    // Verificação do parâmetro auth_type
    if (!authUrl.includes('auth_type=direct')) {
      console.error("⚠️ ALERTA CRÍTICO: O parâmetro auth_type=direct não está presente na URL!");
    } else {
      console.log("✅ Parâmetro auth_type=direct presente na URL");
    }

    console.log("================================================");

    // Em desenvolvimento, mostrar opções para o usuário
    if (process.env.NODE_ENV === 'development') {
      // Extrair os componentes da URL para construir o formulário
      const timestamp = Math.floor(Date.now() / 1000);

      return res.send(`
        <html>
          <head>
            <title>Redirecionamento para Shopee</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .card { border: 1px solid #ccc; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
              .btn { display: inline-block; padding: 10px 16px; border-radius: 4px; text-decoration: none; margin: 10px 5px 10px 0; }
              .primary { background: #ff5722; color: white; }
              .secondary { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
              .instructions { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
              .steps { list-style-type: decimal; padding-left: 20px; }
              .steps li { margin-bottom: 10px; }
              .important { color: #ff0000; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Redirecionamento para Autenticação Shopee</h1>
            <div class="card">
              <h2>URL de Autorização</h2>
              <pre>${authUrl}</pre>

              <div class="instructions">
                <p class="important">Detecção de problema com o parâmetro "timestamp"!</p>
                <p>Use o botão abaixo que utiliza JavaScript para garantir a URL correta:</p>
              </div>

              <button id="redirectBtn" class="btn primary">Ir para Autorização da Shopee</button>
              <a href="/dashboard" class="btn secondary">Voltar para o Dashboard</a>

              <script>
                // Construir a URL via JavaScript para evitar problemas de codificação
                document.getElementById('redirectBtn').addEventListener('click', function() {
                  // Usar o domínio específico para vendedores do Brasil
                  const url = new URL('https://partner.shopeemobile.com/api/v2/shop/auth_partner');
                  
                  // Adicionar parâmetros obrigatórios primeiro
                  url.searchParams.append('partner_id', '${partnerId}');
                  url.searchParams.append('timestamp', '${timestamp}');
                  url.searchParams.append('sign', '${sign}');
                  url.searchParams.append('redirect', 'https://cipshopee.replit.app/api/shopee/callback');
                  
                  // Adicionar parâmetros necessários para login direto do vendedor
                  url.searchParams.append('state', 'cipshopee_${Date.now()}');
                  url.searchParams.append('region', 'BR');
                  url.searchParams.append('is_auth_shop', 'true');
                  url.searchParams.append('login_type', 'seller');
                  url.searchParams.append('auth_type', 'direct');

                  console.log('Redirecionando para URL construída via JavaScript:', url.toString());
                  window.location.href = url.toString();
                });
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Em produção, fazer uma verificação para garantir que a URL está correta
    if (authUrl.includes('×tamp=')) {
      // Corrigir a URL se estiver corrompida
      const fixedUrl = authUrl.replace('×tamp=', 'timestamp=');
      console.log('URL corrigida antes do redirecionamento:', fixedUrl);
      return res.redirect(fixedUrl);
    }

    // Usar axios para capturar o destino do redirecionamento 302
    try {
      const checkRedirect = await axios.get(authUrl, {
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400
      }).catch(error => {
        if (error.response && error.response.status === 302) {
          const location = error.response.headers.location;
          console.log('🔍 DESTINO DO REDIRECIONAMENTO:', location);
          return error.response;
        }
        throw error;
      });
      
      console.log('Resposta da verificação de redirecionamento:', {
        status: checkRedirect?.status,
        headers: checkRedirect?.headers,
      });
    } catch (error) {
      console.log('Erro ao verificar redirecionamento (isso é normal):', error.message);
    }

    return res.redirect(authUrl);

  } catch (error: any) {
    console.error('Error starting Shopee OAuth flow:', error);
    res.status(500).json({
      message: 'Failed to start authorization process',
      error: error.message
    });
  }
});

/**
 * Callback para o fluxo de autorização OAuth da Shopee
 * Esta rota responde em /api/shopee/callback
 */
router.get('/callback', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log(`==== RECEBENDO CALLBACK DA SHOPEE ====`);
    console.log(`Parâmetros recebidos:`, req.query);

    // Validar o state para proteção contra CSRF
    const receivedState = req.query.state as string;
    if (!receivedState || !receivedState.startsWith('cipshopee_')) {
      console.error('State inválido ou ausente na resposta:', receivedState);
      return res.redirect('/dashboard?status=error&message=' + encodeURIComponent('Erro de segurança: State inválido'));
    }

    // Verificar se há erro retornado pela Shopee
    if (req.query.error || req.query.errcode || req.query.errMsg || req.query.message) {
      const errorCode = req.query.errcode || req.query.error || '';
      const errorMsg = req.query.errMsg || req.query.message || 'Erro desconhecido';

      console.error('Erro retornado pela Shopee:', {
        error: req.query.error,
        errcode: errorCode,
        message: errorMsg
      });

      // Tratamento específico para erro de token não encontrado
      if (errorCode === '2' || errorMsg.includes('token not found')) {
        console.log('Detectado erro de token não encontrado. Isso geralmente ocorre quando a URL da API está incorreta. Verificando configuração...');

        // Log detalhado de diagnóstico
        console.log('Configuração atual:');
        console.log('- Domínio da API utilizado:', 'https://partner.shopeemobile.com');
        console.log('- URL de redirecionamento:', process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback');

        // Criar notificação de erro
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Erro na autorização - Token não encontrado',
          message: 'Ocorreu um erro na autenticação com a Shopee. Tente conectar sua loja novamente com as configurações corrigidas.',
          type: 'error',
          isRead: false,
          createdAt: new Date()
        });

        // Redirecionar para a página inicial com instrução para tentar novamente
        return res.redirect('/dashboard?status=error&code=token_not_found&message=' + encodeURIComponent('Token não encontrado. Por favor, tente conectar novamente com as configurações atualizadas.'));
      }

      // Criar notificação de erro para outros tipos de erro
      try {
        await storage.createNotification({
          userId: (req.user as any).claims.sub,
          title: 'Erro na autorização Shopee',
          message: `A Shopee retornou um erro: ${errorMsg}`,
          type: 'error',
          isRead: false,
          createdAt: new Date()
        });
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError);
      }

      return res.redirect('/dashboard?status=error&message=' + encodeURIComponent(errorMsg));
    }

    const { code, shop_id } = req.query;

    if (!code || !shop_id) {
      console.error('Parâmetros obrigatórios ausentes na callback da Shopee:', req.query);
      return res.redirect('/dashboard?status=error&message=Parâmetros obrigatórios ausentes na resposta da Shopee');
    }

    console.log(`Código recebido: ${code}`);
    console.log(`ID da loja: ${shop_id}`);

    // Criar cliente da API
    const shopeeClient = createClient();

    // Configurar headers específicos para BR
    const headers = {
      'X-Region': 'BR',
      'X-Request-ID': crypto.randomUUID()
    };

    // Adicionar headers à requisição
    shopeeClient.setRequestHeaders(headers);

    console.log('Iniciando troca de código por tokens...');

    // Trocar o código por tokens de acesso
    const tokens = await shopeeClient.connect(code as string, shop_id as string);

    console.log('Tokens obtidos com sucesso!');

    // Obter informações da loja (será implementado posteriormente)
    // Temporariamente vamos utilizar um nome genérico
    const shopName = `Shopee Store ${shop_id}`;

    // Verificar se a loja já existe
    const existingStore = await storage.getStoreByShopId(shop_id as string);

    if (existingStore) {
      // Atualizar a loja existente
      await storage.updateStore(existingStore.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
        updatedAt: new Date()
      });

      // Criar notificação
      await storage.createNotification({
        userId: (req.user as any).claims.sub,
        title: 'Loja Shopee reconectada',
        message: `A loja ${existingStore.shopName} foi reconectada com sucesso.`,
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });

      res.redirect('/dashboard');
    } else {
      // Criar nova loja
      const newStore = await storage.createStore({
        userId: (req.user as any).claims.sub,
        shopId: shop_id as string,
        shopName,
        shopRegion: 'BR',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalProducts: 0
      });

      // Criar notificação
      await storage.createNotification({
        userId: (req.user as any).claims.sub,
        title: 'Nova loja Shopee conectada',
        message: `A loja ${shopName} foi conectada com sucesso.`,
        type: 'success',
        isRead: false,
        createdAt: new Date()
      });

      res.redirect('/dashboard');
    }
  } catch (error: any) {
    console.error('Error in Shopee OAuth callback:', error);

    // Criar notificação de erro
    try {
      await storage.createNotification({
        userId: (req.user as any).claims.sub,
        title: 'Erro ao conectar loja Shopee',
        message: `Ocorreu um erro ao conectar sua loja: ${error.message || 'Erro desconhecido'}`,
        type: 'error',
        isRead: false,
        createdAt: new Date()
      });
    } catch (notificationError) {
      console.error('Failed to create error notification:', notificationError);
    }

    res.redirect('/dashboard?status=error&message=' + encodeURIComponent(error.message || 'Unknown error'));
  }
});

/**
 * Verifica o status de conexão com a Shopee
 */
router.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).claims.sub;

    // Obter lojas do usuário
    const stores = await storage.getStoresByUserId(userId);

    // Verificar se há lojas conectadas
    const connected = stores.some(store => store.isActive);

    res.json({
      connected,
      stores: stores.map(store => ({
        id: store.id,
        shopId: store.shopId,
        shopName: store.shopName,
        isActive: store.isActive,
        region: store.shopRegion,
        connectedAt: store.createdAt,
        totalProducts: store.totalProducts
      }))
    });
  } catch (error: any) {
    console.error('Error checking Shopee connection status:', error);
    res.status(500).json({
      message: 'Failed to check connection status',
      error: error.message
    });
  }
});

/**
 * Desconecta uma loja Shopee
 */
router.post('/disconnect/:storeId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({
        message: 'Store not found'
      });
    }

    if (store.userId !== userId) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Marcar a loja como inativa
    await storage.updateStore(store.id, {
      isActive: false,
      updatedAt: new Date()
    });

    // Criar notificação
    await storage.createNotification({
      userId,
      title: 'Loja Shopee desconectada',
      message: `A loja ${store.shopName} foi desconectada.`,
      type: 'info',
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      message: 'Store disconnected successfully'
    });
  } catch (error: any) {
    console.error('Error disconnecting Shopee store:', error);
    res.status(500).json({
      message: 'Failed to disconnect store',
      error: error.message
    });
  }
});

import { createClient } from '../shopee';
import { storage } from '../storage';
export default router;