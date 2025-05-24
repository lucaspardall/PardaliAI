
import { db } from '../db';
import { ShopeeAuthManager } from '../shopee/auth';
import { eq } from 'drizzle-orm';
import { shopeeStores } from '../../shared/schema';
import { storage } from '../storage';

/**
 * Gerenciador de tokens para a API da Shopee
 * Responsável por verificar e atualizar tokens de acesso
 */
class TokenManager {
  /**
   * Atualiza o token de acesso de uma loja Shopee
   * @param storeId ID da loja no banco de dados
   * @returns Token de acesso atualizado
   */
  async refreshToken(storeId: number): Promise<string> {
    try {
      console.log(`Iniciando atualização de token para loja ID: ${storeId}`);
      
      // 1. Buscar store do banco usando storage (abstração sobre Drizzle)
      const store = await storage.getStoreById(storeId);
      
      if (!store) {
        console.error(`Loja não encontrada: ${storeId}`);
        throw new Error('Store not found');
      }
      
      // 2. Verificar se o token já expirou
      const now = new Date();
      if (store.tokenExpiresAt && now < store.tokenExpiresAt) {
        console.log(`Token ainda válido para loja ${storeId}, expira em: ${store.tokenExpiresAt}`);
        return store.accessToken;
      }
      
      // 3. Configuração para o gerenciador de autenticação
      const config = {
        partnerId: process.env.SHOPEE_PARTNER_ID || '2011285',
        partnerKey: process.env.SHOPEE_PARTNER_KEY || '4a4d474641714b566471634a566e4668434159716a6261526b634a69536e4661',
        redirectUrl: process.env.SHOPEE_REDIRECT_URL || 'https://cipshopee.replit.app/api/shopee/callback',
        region: 'BR'
      };
      
      // 4. Criar instância do gerenciador de autenticação
      const authManager = new ShopeeAuthManager(config);
      
      console.log(`Atualizando token para loja ${store.shopId} (ID interno: ${storeId})`);
      
      // 5. Atualizar o token usando o método da classe ShopeeAuthManager
      const tokens = await authManager.refreshAccessToken(store.refreshToken, store.shopId);
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('Failed to refresh token');
      }
      
      // 6. Atualizar token no banco
      await db.update(shopeeStores)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          updatedAt: new Date()
        })
        .where(eq(shopeeStores.id, storeId));
      
      console.log(`Token atualizado com sucesso para loja ${storeId}`);
      
      return tokens.accessToken;
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      throw error;
    }
  }

  /**
   * Verifica se o token de acesso de uma loja está válido
   * @param storeId ID da loja no banco de dados
   * @returns true se o token estiver válido, false caso contrário
   */
  async isTokenValid(storeId: number): Promise<boolean> {
    try {
      // Buscar store do banco usando o método existente
      const store = await storage.getStoreById(storeId);
      
      if (!store) return false;
      
      // Verificar se o token expirou
      // Adicionar margem de 5 minutos para segurança
      const now = new Date();
      const safetyMargin = 5 * 60 * 1000; // 5 minutos em ms
      const expiryWithMargin = new Date(store.tokenExpiresAt);
      expiryWithMargin.setTime(expiryWithMargin.getTime() - safetyMargin);
      
      return now < expiryWithMargin;
    } catch (error) {
      console.error('Erro ao verificar validade do token:', error);
      return false;
    }
  }

  /**
   * Obtém um token válido para uma loja, atualizando-o se necessário
   * @param storeId ID da loja no banco de dados
   * @returns Token de acesso válido
   */
  async getValidToken(storeId: number): Promise<string> {
    const isValid = await this.isTokenValid(storeId);
    
    if (isValid) {
      const store = await storage.getStoreById(storeId);
      return store?.accessToken || '';
    }
    
    // Se não estiver válido, atualiza o token
    return this.refreshToken(storeId);
  }
}

// Exporta uma instância única do gerenciador de tokens
export const tokenManager = new TokenManager();
