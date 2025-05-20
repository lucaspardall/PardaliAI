
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

    // De acordo com a documentação da API v2, o endpoint correto para autorização de vendedores
    const basePathForShopAuthorize = '/shop/auth_partner';
    console.log('Usando endpoint de autorização:', basePathForShopAuthorize);

    console.log(`Gerando URL de autorização para a Shopee`);
    console.log(`Partner ID: ${this.config.partnerId}`);
    console.log(`Região: ${this.config.region}`);
    console.log(`URL de Redirecionamento: ${this.config.redirectUrl}`);

    // Criar o estado único para CSRF protection
    const stateParam = `cipshopee_${Date.now()}`;

    // Criar objeto de parâmetros para geração da assinatura correta
    const params: Record<string, string> = {
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      redirect: this.config.redirectUrl,
      state: stateParam
    };

    // 1. Ordenar parâmetros alfabeticamente como requerido pela API da Shopee
    const orderedParams = Object.fromEntries(
      Object.entries(params).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    );

    // 2. Converter para query string corretamente codificada
    const queryString = Object.entries(orderedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // 3. Formar a string base para a assinatura no formato esperado pela Shopee
    const baseString = `${this.config.partnerId}${basePathForShopAuthorize}${timestamp}`;

    // 4. Gerar assinatura HMAC-SHA256 corretamente
    const hmac = createHmac('sha256', this.config.partnerKey);
    hmac.update(baseString);
    const signature = hmac.digest('hex');

    // 5. Construir a URL final com todos os parâmetros e assinatura usando URLSearchParams
    // para garantir formatação correta dos parâmetros e evitar erros de digitação
    const baseUrl = 'https://partner.shopeemobile.com';
    console.log('Base URL utilizada:', baseUrl);
    
    // Usar variáveis separadas e explícitas para evitar problemas de codificação
    const partner_id = this.config.partnerId;
    const timestampParam = timestamp; // Evitar qualquer transformação do nome "timestamp"
    const sign = signature;
    const redirect = encodeURIComponent(this.config.redirectUrl);
    const state = stateParam;
    
    // Construir a URL com concatenação simples para evitar problemas de interpolação
    const urlString = baseUrl + basePathForShopAuthorize + 
                      "?partner_id=" + partner_id + 
                      "&timestamp=" + timestampParam + 
                      "&sign=" + sign + 
                      "&redirect=" + redirect + 
                      "&state=" + state;
    
    // Verificação robusta da URL gerada usando regex para garantir que o timestamp está correto
    if (!urlString.includes('timestamp=')) {
      console.error("ERRO CRÍTICO: A URL gerada não contém o parâmetro 'timestamp=' corretamente!");
      console.error("URL problemática:", urlString);
      throw new Error(`URL inválida: parâmetro timestamp não encontrado na URL`);
    }
    
    // Verificação adicional com regex para garantir integridade completa do parâmetro
    const timestampRegex = /[?&]timestamp=\d+[&$]/;
    if (!timestampRegex.test(urlString)) {
      console.error("ERRO CRÍTICO: O formato do parâmetro 'timestamp=' não está correto!");
      console.error("URL problemática:", urlString);
      throw new Error(`URL inválida: formato do parâmetro timestamp incorreto`);
    }
    
    // Verificações adicionais para garantir que a URL está correta
    console.log('Verificação da URL completa:', urlString);
    console.log('Verificação do parâmetro timestamp (deve conter "timestamp="):', urlString.includes('timestamp='));
    
    // Verificação visual direta do timestamp para diagnóstico do problema
    console.log("🔎 Verificação direta do timestamp:", `timestamp=${timestampParam}`);
    
    // Salvar URL em um arquivo para inspeção direta (solução definitiva para copiar a URL)
    if (process.env.NODE_ENV === 'development') {
      try {
        // Usar dynamic import para fs em vez de require para compatibilidade ESM
        import('fs').then(fs => {
          fs.writeFileSync('shopee_auth_url.txt', urlString, { encoding: 'utf-8' });
          console.log('✅ URL salva em arquivo para inspeção: shopee_auth_url.txt');
        }).catch(err => {
          console.error('Erro ao importar fs:', err);
        });
        
        // Tentativa de abrir a URL diretamente em uma nova aba, se disponível
        try {
          // Implementaremos isso mais tarde se necessário com dynamic import
          console.log('📝 Para abrir a URL diretamente, você pode adicionar a dependência "open"');
        } catch (openErr) {
          console.error('Não foi possível abrir a URL em uma nova aba:', openErr);
        }
      } catch (e) {
        console.error('Não foi possível salvar a URL em arquivo:', e);
      }
    }

    // Log detalhado para debugging
    console.log(`======= DETALHES DE GERAÇÃO DA URL =======`);
    console.log(`Partner ID: ${this.config.partnerId}`);
    console.log(`Path para autorização: ${basePathForShopAuthorize}`);
    console.log(`String base para assinatura: ${baseString}`);
    console.log(`Assinatura gerada: ${signature}`);
    console.log(`URL de redirecionamento: ${this.config.redirectUrl}`);
    console.log(`URL de autorização final: ${urlString}`);
    console.log(`URL final completa: ${urlString}`);
    console.log(`URL começa com https://partner.shopeemobile.com? ${urlString.startsWith('https://partner.shopeemobile.com')}`);
    console.log(`============================================`);

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
