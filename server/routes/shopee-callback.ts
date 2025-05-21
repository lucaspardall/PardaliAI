/**
 * Tratamento de callback de autorização da Shopee
 */

import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';

export const shopeeCallbackRouter = Router();

// Rota para receber e processar o callback da Shopee após autorização
shopeeCallbackRouter.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('===== CALLBACK DA SHOPEE RECEBIDO =====');
    console.log('Query params:', req.query);
    
    // Verificar se o callback contém código de autorização
    if (!req.query.code) {
      console.error('Erro: Código de autorização não encontrado no callback');
      return res.redirect('/dashboard?error=no_auth_code');
    }
    
    const userId = req.user?.claims?.sub;
    if (!userId) {
      console.error('Erro: Usuário não autenticado ou ID não disponível');
      return res.redirect('/login');
    }
    
    // Extrair parâmetros do callback
    const shopCode = req.query.code as string;
    const shopId = req.query.shop_id;
    const mainAccountId = req.query.main_account_id;
    
    console.log(`Código de autorização: ${shopCode}`);
    console.log(`ID da loja: ${shopId}`);
    console.log(`ID da conta principal: ${mainAccountId}`);
    
    // TODO: Trocar o código de autorização por um token de acesso
    // Isso será implementado quando criarmos a funcionalidade completa da API
    
    // Salvar informações temporárias da loja para o usuário
    try {
      const storeName = `Loja Shopee ${shopId}`;
      const storeData = {
        userId,
        name: storeName,
        platform: 'shopee',
        externalId: shopId ? String(shopId) : undefined,
        authCode: shopCode,
        status: 'connected',
        metadata: {
          mainAccountId: mainAccountId ? String(mainAccountId) : undefined,
          authDate: new Date().toISOString()
        }
      };
      
      // Salvar informações da loja no banco de dados
      await storage.createStore(storeData);
      console.log(`Loja "${storeName}" salva com sucesso para o usuário ${userId}`);
      
      return res.redirect('/dashboard?connected=true');
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      return res.redirect('/dashboard?error=store_save_failed');
    }
  } catch (error) {
    console.error('Erro ao processar callback da Shopee:', error);
    return res.redirect('/dashboard?error=callback_processing_failed');
  }
});