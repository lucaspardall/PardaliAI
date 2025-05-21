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
    // Gerar timestamp e parâmetros necessários
    const timestamp = getTimestamp();

    // Criar o estado único para CSRF protection
    const stateParam = `cipshopee_${Date.now()}`;

    // Verificar se a URL de redirecionamento está definida
    if (!this.config.redirectUrl) {
      throw new Error('URL de redirecionamento não definida na configuração');
    }

    console.log(`===================================================`);
    console.log(`Ambiente: ${process.env.NODE_ENV}`);
    console.log(`Informações de configuração da API:`);
    console.log(`Partner ID: ${this.config.partnerId}`);
    console.log(`URL de redirecionamento configurada: ${this.config.redirectUrl}`);
    console.log(`===================================================`);

    // Nova abordagem baseada no padrão de URL do Upseller
    // Gerar uma string base para assinatura específica para o formato da nova URL
    const baseString = `${this.config.partnerId}timestamp${timestamp}redirect_uri${this.config.redirectUrl}`;
    console.log(`String base para assinatura: ${baseString}`);

    // Gerar assinatura HMAC-SHA256
    const hmac = createHmac('sha256', this.config.partnerKey);
    hmac.update(baseString);
    const signature = hmac.digest('hex');
    console.log(`Assinatura gerada: ${signature}`);

    // Usar URL baseada no padrão encontrado no Upseller, com domínio account.seller.shopee.com
    // Esta abordagem segue o formato para login direto de vendedores
    const authUrl = `https://account.seller.shopee.com/signin/oauth/accountchooser?` +
      `client_id=${this.config.partnerId}&` +
      `lang=pt-br&` +
      `login_types=%5B1,4,2%5D&` +
      `max_auth_age=3600&` +
      `redirect_uri=${encodeURIComponent(this.config.redirectUrl)}&` +
      `region=SG&` +
      `required_passwd=true&` +
      `respond_code=code&` +
      `scope=profile&` +
      `sign=${signature}&` +
      `timestamp=${timestamp}&` +
      `state=${stateParam}`;

    // Construir a URL final manualmente para garantir consistência
    const finalUrl = authUrl;

    console.log(`✅ URL de autorização da Shopee: ${finalUrl}`);

    // Salvar URL em um arquivo para inspeção direta
    if (process.env.NODE_ENV === 'development') {
      try {
        import('fs').then(fs => {
          fs.writeFileSync('shopee_auth_url.txt', finalUrl, { encoding: 'utf-8' });
          console.log('✅ URL salva em arquivo para inspeção: shopee_auth_url.txt');
        }).catch(err => {
          console.error('Erro ao importar fs:', err);
        });
      } catch (e) {
        console.error('Não foi possível salvar a URL em arquivo:', e);
      }
    }

    // Verificação de parâmetros importantes
    console.log('Verificação de parâmetros importantes:');
    console.log('- client_id:', finalUrl.includes(`client_id=${this.config.partnerId}`));
    console.log('- timestamp:', finalUrl.includes(`timestamp=${timestamp}`));
    console.log('- sign:', finalUrl.includes(`sign=${signature}`));
    console.log('- redirect_uri:', finalUrl.includes('redirect_uri='));
    console.log('- region=SG:', finalUrl.includes('region=SG'));
    console.log('================================================');

    return finalUrl;
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
        console.error('Tokens não encontrados na resposta:', data);
        throw {
          error: 'TokenNotFound',
          message: 'Tokens de acesso não encontrados na resposta',
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
}