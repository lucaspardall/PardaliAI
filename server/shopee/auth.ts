/**
 * Gerenciador de autenticação para a API da Shopee
 */
import { createHmac } from 'crypto';
import axios from 'axios';
import { ShopeeAuthConfig, ShopeeAuthTokens } from './types';
import { getApiBaseUrl, getTimestamp, parseApiError } from './utils';
import { AUTH } from './endpoints';

/**
 * Gerencia o processo de autenticação com a API da Shopee
 */
export class ShopeeAuthManager {
  private config: ShopeeAuthConfig;

  constructor(config: ShopeeAuthConfig) {
    this.config = config;
  }

  /**
   * Gera a URL de autorização para OAuth
   */
  getAuthorizationUrl(): string {
    const timestamp = getTimestamp();
    const baseUrl = getApiBaseUrl(this.config.region);
    const path = '/api/v2/shop/auth_partner';

    // Preparar parâmetros para assinatura (SEM o sign)
    const authParams = {
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      redirect: this.config.redirectUrl
    };

    // Gerar assinatura seguindo o padrão oficial da Shopee
    const signature = this.generateShopeeSignature(path, authParams);

    console.log(`Assinatura gerada: ${signature}`);

    // Gerar state único para proteção CSRF
    const state = `cipshopee_${Date.now()}`;

    // Construir parâmetros finais (COM o sign)
    const params = new URLSearchParams({
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      sign: signature,
      redirect: this.config.redirectUrl,
      state: state
    });

    const authUrl = `${baseUrl}${path}?${params.toString()}`;

    console.log(`✅ URL de autorização da Shopee: ${authUrl}`);

    // Log de verificação dos parâmetros
    console.log('Verificação de parâmetros importantes:');
    console.log(`- partner_id: ${params.has('partner_id')}`);
    console.log(`- timestamp: ${params.has('timestamp')}`);
    console.log(`- sign: ${params.has('sign')}`);
    console.log(`- redirect: ${params.has('redirect')}`);
    console.log(`- auth_type=direct: ${params.has('auth_type')}`);
    console.log(`- login_type=seller: ${params.has('login_type')}`);
    console.log(`🔎 Verificação direta do timestamp: timestamp=${timestamp}`);
    console.log('================================================');

    return authUrl;
  }

  /**
   * Gera assinatura seguindo o padrão oficial da Shopee
   */
  private generateShopeeSignature(path: string, params: Record<string, string>): string {
    // Ordenar parâmetros alfabeticamente (excluindo 'sign' se existir)
    const sortedKeys = Object.keys(params)
      .filter(key => key !== 'sign')
      .sort();

    // Construir string base: partner_key + path + ordenação(params) + partner_key
    let baseString = this.config.partnerKey + path;

    // Adicionar parâmetros ordenados
    sortedKeys.forEach(key => {
      baseString += key + params[key];
    });

    baseString += this.config.partnerKey;

    console.log(`String base para assinatura: ${baseString}`);

    // Gerar HMAC SHA256
    const hmac = createHmac('sha256', this.config.partnerKey);
    hmac.update(baseString);
    return hmac.digest('hex');
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

      console.log(`==== INICIANDO OBTENÇÃO DE TOKEN SHOPEE ====`);
      console.log(`Código de autorização: ${code.substring(0, 10)}...`);
      console.log(`ID da loja: ${shopId}`);
      console.log(`Timestamp: ${timestamp}`);
      console.log(`Base URL: ${baseUrl}`);
      console.log(`Endpoint: ${path}`);

      // Corpo da requisição (parâmetros específicos do endpoint)
      const requestBody = {
        partner_id: Number(this.config.partnerId),
        code,
        shop_id: Number(shopId)
      };

      // Corpo JSON minificado para usar na assinatura
      const minifiedRequestBody = JSON.stringify(requestBody);

      // String base para assinatura (partner_id + path + timestamp + corpo_json_minificado)
      const baseString = `${this.config.partnerId}${path}${timestamp}${minifiedRequestBody}`;

      // Gerar assinatura HMAC-SHA256
      const hmac = createHmac('sha256', this.config.partnerKey);
      hmac.update(baseString);
      const signature = hmac.digest('hex');

      // URL completa com parâmetros comuns na query string usando URLSearchParams para evitar problemas de codificação
      const urlParams = new URLSearchParams();
      urlParams.append('partner_id', this.config.partnerId);
      urlParams.append('timestamp', timestamp.toString());
      urlParams.append('sign', signature);

      const requestUrl = `${baseUrl}${path}?${urlParams.toString()}`;

      console.log('======= DETALHES DA REQUISIÇÃO DE TOKEN =======');
      console.log('URL completa:', requestUrl);
      console.log('String base para assinatura:', baseString);
      console.log('Corpo da requisição:', minifiedRequestBody);
      console.log('Assinatura gerada:', signature);
      console.log('=============================================');

      // Fazer a requisição com os parâmetros no corpo e assinatura na URL
      console.log('Enviando requisição para obter token...');
      const response = await axios({
        method: 'post',
        url: requestUrl,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Region': 'BR'
        },
        timeout: 15000 // 15 segundos de timeout
      });

      const data = response.data;

      // Log da resposta (removendo dados sensíveis para o log)
      console.log('Resposta da API de token:', JSON.stringify({
        ...data,
        access_token: data.access_token ? '***' : undefined,
        refresh_token: data.refresh_token ? '***' : undefined
      }, null, 2));

      // Verificar erros na resposta
      if (data.error) {
        console.error('Erro retornado pela API:', {
          error: data.error,
          message: data.message,
          requestId: data.request_id
        });

        throw {
          error: data.error,
          message: data.message || 'Falha ao obter token de acesso',
          requestId: data.request_id,
        };
      }

      // Verificar se os tokens necessários estão presentes
      if (!data.access_token || !data.refresh_token) {
        console.error('==== TOKENS NÃO ENCONTRADOS ====');
        console.error('Resposta completa da API:', JSON.stringify(data, null, 2));
        console.error('access_token presente:', !!data.access_token);
        console.error('refresh_token presente:', !!data.refresh_token);
        console.error('===============================');
        throw {
          error: 'TokenNotFound',
          message: 'Tokens de acesso não encontrados na resposta',
          response: data
        };
      }

      // Calcular expiração do token (data atual + expire_in em segundos)
      const expiresIn = data.expire_in || 14400; // Padrão: 4 horas
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      console.log(`Token obtido com sucesso! Expira em: ${expiresIn} segundos`);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId,
      };
    } catch (error: any) {
      console.error('==== ERRO AO OBTER TOKEN DE ACESSO ====');

      // Log detalhado do erro
      if (error.response) {
        console.error('Resposta de erro:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Erro de requisição (sem resposta):', error.request);
      } else {
        console.error('Erro:', error.message);
      }

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

      // Corpo da requisição
      const requestBody = {
        refresh_token: refreshToken,
        shop_id: Number(shopId),
        partner_id: Number(this.config.partnerId)
      };

      // Corpo JSON minificado para usar na assinatura
      const minifiedRequestBody = JSON.stringify(requestBody);

      // String base para assinatura (partner_id + path + timestamp + corpo_json_minificado)
      const baseString = `${this.config.partnerId}${path}${timestamp}${minifiedRequestBody}`;

      // Gerar assinatura HMAC-SHA256
      const hmac = createHmac('sha256', this.config.partnerKey);
      hmac.update(baseString);
      const signature = hmac.digest('hex');

      // URL completa com parâmetros comuns na query string usando URLSearchParams para evitar problemas de codificação
      const urlParams = new URLSearchParams();
      urlParams.append('partner_id', this.config.partnerId);
      urlParams.append('timestamp', timestamp.toString());
      urlParams.append('sign', signature);

      const requestUrl = `${baseUrl}${path}?${urlParams.toString()}`;

      console.log('======= DETALHES DA REQUISIÇÃO DE REFRESH TOKEN =======');
      console.log('URL completa:', requestUrl);
      console.log('String base para assinatura:', baseString);
      console.log('Corpo da requisição:', minifiedRequestBody);
      console.log('===================================================');

      // Fazer a requisição
      const response = await axios({
        method: 'post',
        url: requestUrl,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      console.log('Resposta da API de refresh token:', JSON.stringify(data, null, 2));

      if (data.error) {
        throw {
          error: data.error,
          message: data.message || 'Failed to refresh access token',
          requestId: data.request_id,
        };
      }

      // Calcular expiração do token (data atual + expire_in em segundos)
      const expiresIn = data.expire_in || 14400; // Padrão: 4 horas
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        shopId,
      };
    } catch (error) {
      console.error('Erro ao atualizar token de acesso:', error.response?.data || error.message);
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

  /**
   * Troca o código de autorização por tokens de acesso
   */
  async exchangeCodeForTokens(code: string, shopId: string): Promise<ShopeeAuthTokens> {
    const timestamp = getTimestamp();
    const baseUrl = getApiBaseUrl(this.config.region);
    const path = '/api/v2/auth/token/get';

    // Criar payload da requisição
    const requestBody = {
      code,
      shop_id: parseInt(shopId),
      partner_id: parseInt(this.config.partnerId)
    };

    // Preparar parâmetros para assinatura
    const queryParams = {
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString()
    };

    // Gerar assinatura para a requisição POST
    const signature = this.generateShopeeSignature(path, queryParams);

    console.log(`[Auth] Trocando código por tokens...`);
    console.log(`[Auth] Código: ${code}`);
    console.log(`[Auth] Shop ID: ${shopId}`);
    console.log(`[Auth] Timestamp: ${timestamp}`);
    console.log(`[Auth] Assinatura: ${signature}`);

    try {
      const response = await fetch(`${baseUrl}${path}?partner_id=${this.config.partnerId}&timestamp=${timestamp}&sign=${signature}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Auth] Erro HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[Auth] Resposta da API:`, JSON.stringify(data, null, 2));

      if (data.error || !data.response) {
        console.error(`[Auth] Erro da API Shopee:`, data);
        throw new Error(data.message || data.error || 'Failed to get tokens');
      }

      const tokenData = data.response;
      const expiresAt = new Date(Date.now() + (tokenData.expire_in * 1000));

      console.log(`[Auth] Tokens obtidos com sucesso. Expiram em: ${expiresAt}`);

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        shopId
      };

    } catch (error) {
      console.error(`[Auth] Erro ao trocar código por tokens:`, error);
      throw error;
    }
  }
}

/**
 * Método auxiliar para gerar URL de autorização diretamente
 * @param config Configuração da autenticação Shopee
 */
export function getAuthorizationUrl(config: ShopeeAuthConfig): string {
  const authManager = new ShopeeAuthManager(config);
  return authManager.getAuthorizationUrl();
}

/**
 * Método auxiliar para trocar o código por tokens
 * @param config Configuração da autenticação Shopee
 * @param code Código de autorização
 * @param shopId ID da loja
 */
export async function getAccessToken(
  config: ShopeeAuthConfig,
  code: string,
  shopId: string
): Promise<ShopeeAuthTokens> {
  const authManager = new ShopeeAuthManager(config);
  return authManager.getAccessToken(code, shopId);
}