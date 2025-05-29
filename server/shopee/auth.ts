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
    console.log(`[getAccessToken] Iniciando troca de código por tokens...`);
    console.log(`[getAccessToken] Shop ID: ${shopId}`);
    console.log(`[getAccessToken] Code: ${code.substring(0, 10)}...`);

    const timestamp = getTimestamp();
    const baseUrl = getApiBaseUrl(this.config.region);
    const path = '/api/v2/auth/token/get';

    // Dados da requisição
    const requestBody = {
      code: code,
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
  console.log(`[getAccessToken] Iniciando troca de código por tokens...`);
  console.log(`[getAccessToken] Shop ID: ${shopId}`);
  console.log(`[getAccessToken] Code: ${code.substring(0, 10)}...`);

  const timestamp = Math.floor(Date.now() / 1000);
  const path = '/api/v2/auth/token/get';

  // Dados da requisição
  const requestData = {
    code: code,
    shop_id: parseInt(shopId),
    partner_id: parseInt(config.partnerId)
  };

  // String base para assinatura (sem access_token na primeira chamada)
  const baseString = `${config.partnerId}${path}${timestamp}`;
  console.log(`[getAccessToken] Base string: ${baseString}`);

  // Gerar assinatura
  const signature = crypto.createHmac('sha256', config.partnerKey).update(baseString).digest('hex');
  console.log(`[getAccessToken] Signature gerada`);

  // Parâmetros da query
  const queryParams = new URLSearchParams({
    partner_id: config.partnerId,
    timestamp: timestamp.toString(),
    sign: signature
  });

  const fullUrl = `https://partner.shopeemobile.com${path}?${queryParams.toString()}`;
  console.log(`[getAccessToken] URL: ${fullUrl}`);

  try {
    console.log(`[getAccessToken] Enviando requisição...`);

    // Usar fetch para evitar problemas de referência circular
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CIP-Shopee-Auth/1.0'
      },
      body: JSON.stringify(requestData)
    });

    console.log(`[getAccessToken] Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getAccessToken] HTTP Error:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();

    console.log(`[getAccessToken] Resposta recebida:`, {
      hasAccessToken: !!responseData.access_token,
      hasRefreshToken: !!responseData.refresh_token,
      expiresIn: responseData.expire_in
    });

    if (responseData.error) {
      throw new Error(`Shopee API Error: ${responseData.error} - ${responseData.message || 'Unknown error'}`);
    }

    if (!responseData.access_token) {
      throw new Error('Access token not received from Shopee API');
    }

    // Calcular data de expiração
    const expiresIn = responseData.expire_in || 3600; // 1 hora por padrão
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log(`[getAccessToken] ✅ Tokens obtidos com sucesso!`);

    return {
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token || '',
      expiresAt
    };

  } catch (error: any) {
    console.error(`[getAccessToken] ❌ Erro:`, error.message);
    throw error;
  }
}

/**
 * Função de conveniência para renovar tokens
 */
export async function refreshAccessToken(config: ShopeeAuthConfig, refreshToken: string, shopId: string): Promise<ShopeeAuthTokens> {
  const authManager = new ShopeeAuthManager(config);
  return authManager.refreshAccessToken(refreshToken, shopId);
}