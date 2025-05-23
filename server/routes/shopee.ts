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

    // Importar a implementação de diagnóstico para Shopee
    const { generateAuthUrls, generateDiagnosticPage } = await import('../shopee/fallback');

    // Verificar se está em modo direto (sem página de diagnóstico)
    const directMode = req.query.direct === 'true';
    const method = req.query.method as string || 'standard';

    // Configuração da integração Shopee
    const config = {
      partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
      redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
      region: 'SG'
    };

    // Gerar URLs de autorização com todos os métodos disponíveis
    const urls = generateAuthUrls(config);
    
    // Salvar URLs em arquivo para inspeção e debug
    try {
      fs.writeFileSync('shopee_auth_url.txt', 
        `URL Padrão: ${urls.standardUrl}\n\nURL Alternativa: ${urls.alternativeUrl}\n\nURL Login Direto: ${urls.directSellerLoginUrl}`);
      console.log("✅ URLs salvas em arquivo para inspeção: shopee_auth_url.txt");
    } catch (err) {
      console.error("Não foi possível salvar URLs em arquivo:", err);
    }
    
    // Se mode direto, redirecionar para o método solicitado
    if (directMode) {
      let redirectUrl;
      
      switch (method) {
        case 'alternative':
          redirectUrl = urls.alternativeUrl;
          break;
        case 'direct':
          redirectUrl = urls.directSellerLoginUrl;
          break;
        case 'standard':
        default:
          redirectUrl = urls.standardUrl;
          break;
      }
      
      console.log(`Redirecionando diretamente para método ${method}: ${redirectUrl.substring(0, 100)}...`);
      return res.redirect(redirectUrl);
    }
    
    // Gerar a página de diagnóstico com todas as opções para teste
    const htmlContent = generateDiagnosticPage(urls);
    
    return res.send(htmlContent);

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
      if (errorCode === '2' || (typeof errorMsg === 'string' && errorMsg.includes('token not found'))) {
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