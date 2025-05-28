
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

    // Construir URL com parâmetros corretos
    const params = new URLSearchParams({
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      sign: signature,
      redirect: this.config.redirectUrl,
      state: state
    });

    const authUrl = `${baseUrl}${path}?${params.toString()}`;

    console.log('✅ URL de autorização OAuth gerada com sucesso:', authUrl);
    console.log('🔄 Status 302 é esperado - indica redirecionamento para login da Shopee');

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

      const data = response.data.response;
      const expiresAt = new Date(Date.now() + (data.expire_in * 1000));

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId
      };

    } catch (error: any) {
      console.error('Error getting access token:', error);
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
      partner_id: parseInt(this.config.partnerId),
      shop_id: parseInt(shopId)
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
        throw new Error(`Token refresh failed: ${response.data.message || response.data.error}`);
      }

      const data = response.data.response;
      const expiresAt = new Date(Date.now() + (data.expire_in * 1000));

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId
      };

    } catch (error: any) {
      console.error('Error refreshing token:', error);
      throw parseApiError(error);
    }
  }
}
