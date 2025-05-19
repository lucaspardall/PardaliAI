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
   * Implementa o fluxo de autorização conforme documentação oficial da Shopee Open Platform
   */
  getAuthorizationUrl(): string {
    const timestamp = getTimestamp();
    
    // De acordo com a documentação da API v2, o endpoint correto para autorização
    const basePathForShopAuthorize = '/api/v2/shop/auth_partner';
    
    console.log(`Gerando URL de autorização para a Shopee`);
    console.log(`Partner ID: ${this.config.partnerId}`);
    console.log(`Região: ${this.config.region}`);
    console.log(`URL de Redirecionamento: ${this.config.redirectUrl}`);
    
    // Gerando assinatura no formato esperado pela Shopee
    // A string base para assinatura deve incluir: partner_id + api_path + timestamp
    const signature = generateSignature(
      this.config.partnerId, 
      this.config.partnerKey, 
      basePathForShopAuthorize, 
      timestamp
    );
    
    // Construção da URL com todos os parâmetros necessários
    // Usamos a base URL da região + o path
    const baseUrl = getApiBaseUrl(this.config.region);
    const url = new URL(baseUrl + basePathForShopAuthorize);
    
    // Parâmetros obrigatórios conforme documentação
    url.searchParams.append('partner_id', this.config.partnerId);
    url.searchParams.append('timestamp', timestamp.toString());
    url.searchParams.append('sign', signature);
    url.searchParams.append('redirect', this.config.redirectUrl);
    
    console.log(`URL de autorização gerada: ${url.toString()}`);
    
    return url.toString();urn url.toString();
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
      
      // Usando a assinatura correta conforme documentação - sem token de acesso nesta etapa
      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        path,
        timestamp
      );
      
      console.log('Obtendo token de acesso - URL:', `${baseUrl}${path}`);
      console.log('Obtendo token de acesso - Dados:', { code, shop_id: Number(shopId), partner_id: Number(this.config.partnerId) });
      
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