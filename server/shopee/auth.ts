/**
 * Gerenciamento de autenticação OAuth para Shopee API
 */
import axios from 'axios';
import { AUTH } from './endpoints';
import { ShopeeAuthConfig, ShopeeAuthTokens, ShopeeApiError } from './types';
import { generateSignature, getTimestamp, getApiBaseUrl, parseApiError } from './utils';

/**
 * Classe para gerenciar autenticação com a API da Shopee
 */
export class ShopeeAuthManager {
  private config: ShopeeAuthConfig;

  constructor(config: ShopeeAuthConfig) {
    this.config = config;
  }

  /**
   * Gera URL para o fluxo de autorização OAuth
   */
  getAuthorizationUrl(): string {
    const timestamp = getTimestamp();
    const path = AUTH.AUTHORIZE; // Agora contém a URL completa
    
    // Criar objeto de estado que a Shopee espera
    const state = {
      nonce: Math.random().toString(36).substring(2, 15),
      id: Number(this.config.partnerId),
      auth_shop: 1,
      next_url: "https://open.shopee.com/authorize?isRedirect=true",
      is_auth: 0
    };
    
    // Convertendo para base64
    const stateStr = Buffer.from(JSON.stringify(state)).toString('base64');
    
    // Gerando assinatura no formato esperado pela Shopee
    const signature = generateSignature(
      this.config.partnerId, 
      this.config.partnerKey, 
      "/api/v1/oauth2/callback", 
      timestamp
    );
    
    // Construção da URL com todos os parâmetros necessários
    const url = new URL(path);
    url.searchParams.append('client_id', this.config.partnerId);
    url.searchParams.append('lang', 'pt');
    url.searchParams.append('login_types', '[1,4,2]');
    url.searchParams.append('max_auth_age', '3600');
    url.searchParams.append('redirect_uri', 'https://open.shopee.com/api/v1/oauth2/callback');
    url.searchParams.append('region', 'BR');
    url.searchParams.append('required_passwd', 'true');
    url.searchParams.append('respond_code', 'code');
    url.searchParams.append('scope', 'profile');
    url.searchParams.append('sign', signature);
    url.searchParams.append('state', stateStr);
    url.searchParams.append('timestamp', timestamp.toString());
    url.searchParams.append('title', 'sla_title_open_platform_app_login');
    
    return url.toString();
  }

  /**
   * Obtém tokens de acesso após autorização do usuário
   * @param code Código de autorização retornado pela Shopee
   * @param shopId ID da loja 
   */
  async getAccessToken(code: string, shopId: string): Promise<ShopeeAuthTokens> {
    try {
      const timestamp = getTimestamp();
      const baseUrl = getApiBaseUrl(this.config.region);
      const path = AUTH.GET_TOKEN;
      
      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        path,
        timestamp
      );
      
      const response = await axios.post(`${baseUrl}${path}`, {
        code,
        shop_id: Number(shopId),
        partner_id: Number(this.config.partnerId),
      }, {
        params: {
          partner_id: this.config.partnerId,
          timestamp,
          sign: signature,
        },
      });
      
      const data = response.data;
      
      if (data.error) {
        throw {
          error: data.error,
          message: data.message || 'Failed to get access token',
          requestId: data.request_id,
        };
      }
      
      // Calcular expiração do token (data atual + refresh_token_valid_time em segundos)
      const expiresAt = new Date();
      expiresAt.setSeconds(
        expiresAt.getSeconds() + data.refresh_token_valid_time || 30 * 24 * 60 * 60 // Padrão: 30 dias
      );
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId,
      };
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   * @param refreshToken Token de atualização
   * @param shopId ID da loja
   */
  async refreshAccessToken(refreshToken: string, shopId: string): Promise<ShopeeAuthTokens> {
    try {
      const timestamp = getTimestamp();
      const baseUrl = getApiBaseUrl(this.config.region);
      const path = AUTH.REFRESH_TOKEN;
      
      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        path,
        timestamp
      );
      
      const response = await axios.post(`${baseUrl}${path}`, {
        refresh_token: refreshToken,
        shop_id: Number(shopId),
        partner_id: Number(this.config.partnerId),
      }, {
        params: {
          partner_id: this.config.partnerId,
          timestamp,
          sign: signature,
        },
      });
      
      const data = response.data;
      
      if (data.error) {
        throw {
          error: data.error,
          message: data.message || 'Failed to refresh access token',
          requestId: data.request_id,
        };
      }
      
      // Calcular expiração do token (data atual + refresh_token_valid_time em segundos)
      const expiresAt = new Date();
      expiresAt.setSeconds(
        expiresAt.getSeconds() + data.refresh_token_valid_time || 30 * 24 * 60 * 60 // Padrão: 30 dias
      );
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId,
      };
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * Verifica se o token de acesso está expirado
   * @param expiresAt Data de expiração do token
   * @param bufferSeconds Margem de segurança em segundos (padrão: 5 minutos)
   */
  isTokenExpired(expiresAt: Date, bufferSeconds = 300): boolean {
    const now = new Date();
    const expirationWithBuffer = new Date(expiresAt);
    expirationWithBuffer.setSeconds(expirationWithBuffer.getSeconds() - bufferSeconds);
    
    return now >= expirationWithBuffer;
  }
}