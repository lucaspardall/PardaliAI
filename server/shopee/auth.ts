/**
 * Gerenciamento de autenticação OAuth para Shopee API
 */
import axios from 'axios';
import { createHmac } from 'crypto';
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
    
    // Criar o estado único para CSRF protection
    const stateParam = `cipshopee_${Date.now()}`;
    
    // Criar os parâmetros conforme documentação: IMPORTANTE ordenar alfabeticamente
    const params: Record<string, string> = {
      partner_id: this.config.partnerId,
      redirect: this.config.redirectUrl,
      state: stateParam,
      timestamp: timestamp.toString()
    };
    
    // Ordenar os parâmetros alfabeticamente e gerar a string de consulta
    const orderedParams = Object.keys(params).sort().reduce(
      (obj, key) => { 
        obj[key] = params[key]; 
        return obj;
      }, 
      {} as Record<string, string>
    );
    
    // Converter para query string
    const queryString = Object.entries(orderedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Formar a string base para a assinatura
    const signatureBaseString = `${basePathForShopAuthorize}?${queryString}`;
    console.log(`Assinatura - String base: ${signatureBaseString}`);
    
    // Gerar assinatura HMAC-SHA256
    const hmac = createHmac('sha256', this.config.partnerKey);
    hmac.update(signatureBaseString);
    const signature = hmac.digest('hex');
    
    // Obter URL base da API para a região configurada
    const baseUrl = getApiBaseUrl(this.config.region);
    
    // Construir a URL com a classe URL para garantir formatação correta
    const url = new URL(`${baseUrl}${basePathForShopAuthorize}`);
    
    // Adicionar todos os parâmetros usando searchParams
    Object.entries(orderedParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    // Adicionar a assinatura
    url.searchParams.append('sign', signature);
    
    // Converter para string
    const urlString = url.toString();
    
    // Log da URL gerada
    console.log(`URL de autorização gerada: ${urlString}`);
    
    return urlString;
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
      
      // Parâmetros para o request, conforme documentação da Shopee
      const params: Record<string, any> = {
        partner_id: Number(this.config.partnerId),
        code,
        shop_id: Number(shopId),
        timestamp
      };
      
      // Ordenar parâmetros em ordem alfabética para gerar a string base para assinatura
      const sortedParamKeys = Object.keys(params).sort();
      const sortedParams = sortedParamKeys.map(key => `${key}=${params[key]}`).join('&');
      
      // Construir a string base para assinatura conforme a documentação
      const baseString = `${path}?${sortedParams}`;
      
      // Gerar assinatura HMAC-SHA256
      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        baseString,
        timestamp,
        undefined,
        undefined,
        true // Usar a string base diretamente
      );
      
      console.log('Obtendo token de acesso - URL:', `${baseUrl}${path}`);
      console.log('Obtendo token de acesso - String base para assinatura:', baseString);
      console.log('Obtendo token de acesso - Dados:', params);
      
      // Configurar headers conforme documentação
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `SHA256 ${signature}`
      };
      
      // Fazer a requisição com os parâmetros e assinatura
      const response = await axios({
        method: 'post',
        url: `${baseUrl}${path}`,
        data: params,
        headers: headers
      });
      
      const data = response.data;
      
      console.log('Resposta da API de token:', JSON.stringify(data, null, 2));
      
      if (data.error) {
        throw {
          error: data.error,
          message: data.message || 'Failed to get access token',
          requestId: data.request_id,
        };
      }
      
      // Calcular expiração do token (data atual + refresh_token_valid_time em segundos)
      const expiresIn = data.expire_in || 14400; // Padrão: 4 horas
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId,
      };
    } catch (error: any) {
      console.error('Erro ao obter token de acesso:', error.response?.data || error.message);
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