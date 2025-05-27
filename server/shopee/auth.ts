
/**
 * Gerenciador de autenticação para a API da Shopee
 */
import crypto from 'crypto';
import axios from 'axios';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { generateSignature, getTimestamp, getApiBaseUrl, parseApiError } from './utils';

/**
 * Gerenciador de autenticação Shopee
 */
export class ShopeeAuthManager {
  private config: ShopeeAuthConfig;

  constructor(config: ShopeeAuthConfig) {
    this.config = config;
  }

  /**
   * Verifica se o token está expirado
   */
  isTokenExpired(expiresAt: Date): boolean {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutos de buffer
    return now.getTime() >= (expiresAt.getTime() - bufferTime);
  }

  /**
   * Gera URL de autorização OAuth para a Shopee
   */
  getAuthorizationUrl(): string {
    const timestamp = getTimestamp();
    const baseUrl = getApiBaseUrl(this.config.region);
    const path = '/api/v2/shop/auth_partner';
    
    // Gerar assinatura para autorização OAuth
    const signature = generateSignature(
      this.config.partnerId,
      this.config.partnerKey,
      path,
      timestamp
    );

    const state = `cipshopee_${Date.now()}`;

    // Construir URL com parâmetros
    const params = new URLSearchParams({
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      sign: signature,
      redirect: this.config.redirectUrl,
      state: state
    });

    const authUrl = `${baseUrl}${path}?${params.toString()}`;
    
    console.log('URL de autorização gerada:', authUrl);
    
    return authUrl;
  }

  /**
   * Troca código de autorização por tokens de acesso
   */
  async getAccessToken(code: string, shopId: string): Promise<ShopeeAuthTokens> {
    const timestamp = getTimestamp();
    const baseUrl = getApiBaseUrl(this.config.region);
    const path = '/api/v2/auth/token/get';

    // Dados para troca de tokens
    const requestBody = {
      code,
      shop_id: parseInt(shopId),
      partner_id: parseInt(this.config.partnerId)
    };

    // Gerar assinatura para requisição de tokens
    const signature = generateSignature(
      this.config.partnerId,
      this.config.partnerKey,
      path,
      timestamp,
      undefined,
      undefined,
      requestBody
    );

    const url = `${baseUrl}${path}`;
    const params = {
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      sign: signature
    };

    try {
      console.log('Fazendo requisição para obter tokens:', {
        url,
        params,
        body: requestBody
      });

      const response = await axios.post(url, requestBody, {
        params,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.error) {
        throw new Error(`Shopee API Error: ${response.data.message || response.data.error}`);
      }

      const tokenData = response.data.response;
      
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expire_in * 1000)),
        shopId: shopId
      };

    } catch (error: any) {
      console.error('Erro ao obter tokens:', error);
      throw parseApiError(error);
    }
  }

  /**
   * Atualiza tokens usando refresh token
   */
  async refreshAccessToken(refreshToken: string, shopId: string): Promise<ShopeeAuthTokens> {
    const timestamp = getTimestamp();
    const baseUrl = getApiBaseUrl(this.config.region);
    const path = '/api/v2/auth/access_token/get';

    const requestBody = {
      refresh_token: refreshToken,
      shop_id: parseInt(shopId),
      partner_id: parseInt(this.config.partnerId)
    };

    const signature = generateSignature(
      this.config.partnerId,
      this.config.partnerKey,
      path,
      timestamp,
      undefined,
      undefined,
      requestBody
    );

    const url = `${baseUrl}${path}`;
    const params = {
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      sign: signature
    };

    try {
      const response = await axios.post(url, requestBody, {
        params,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.error) {
        throw new Error(`Shopee API Error: ${response.data.message || response.data.error}`);
      }

      const tokenData = response.data.response;
      
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expire_in * 1000)),
        shopId: shopId
      };

    } catch (error: any) {
      console.error('Erro ao renovar tokens:', error);
      throw parseApiError(error);
    }
  }
}

/**
 * Função de conveniência para gerar URL de autorização
 */
export function getAuthorizationUrl(config: ShopeeAuthConfig): string {
  const authManager = new ShopeeAuthManager(config);
  return authManager.getAuthorizationUrl();
}

/**
 * Função de conveniência para obter tokens de acesso
 */
export async function getAccessToken(config: ShopeeAuthConfig, code: string, shopId: string): Promise<ShopeeAuthTokens> {
  const authManager = new ShopeeAuthManager(config);
  return authManager.getAccessToken(code, shopId);
}

/**
 * Função de conveniência para renovar tokens
 */
export async function refreshAccessToken(config: ShopeeAuthConfig, refreshToken: string, shopId: string): Promise<ShopeeAuthTokens> {
  const authManager = new ShopeeAuthManager(config);
  return authManager.refreshAccessToken(refreshToken, shopId);
}
