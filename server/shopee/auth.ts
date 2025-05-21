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

    // Usar o endpoint correto para login de vendedor na Shopee
    console.log(`Gerando URL de autorização para a Shopee`);
    console.log(`Partner ID: ${this.config.partnerId}`);
    console.log(`Região: ${this.config.region}`);
    console.log(`URL de Redirecionamento: ${this.config.redirectUrl}`);

    // Verificar se a URL de redirecionamento está definida
    if (!this.config.redirectUrl) {
      throw new Error('URL de redirecionamento não definida na configuração');
    }

    // 1. Formar a string base para a assinatura conforme documentação da Shopee
    const baseString = `${this.config.partnerId}${timestamp}`;
    console.log('String base para assinatura:', baseString);

    // 2. Gerar assinatura HMAC-SHA256
    const hmac = createHmac('sha256', this.config.partnerKey);
    hmac.update(baseString);
    const signature = hmac.digest('hex');
    console.log('Assinatura gerada:', signature);

    // 3. Obter o domínio para autenticação de vendedor
    const baseUrl = getApiBaseUrl(this.config.region, true);
    console.log('Usando domínio para autenticação de vendedor:', baseUrl);

    // 4. Criar estado para CSRF protection e informações adicionais de autenticação
    const stateData = {
      nonce: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      id: parseInt(this.config.partnerId),
      auth_shop: 1,
      next_url: `https://open.shopee.com.br/authorize?isRedirect=true`,
      is_auth: 0
    };
    
    // Codificar o objeto state para Base64
    const stateEncoded = Buffer.from(JSON.stringify(stateData)).toString('base64');
    console.log('Estado codificado:', stateEncoded);

    // 5. Construir a URL com os parâmetros para login direto de vendedor
    const params = new URLSearchParams();

    // Adicionar parâmetros conforme visto na URL que funciona
    params.append('client_id', this.config.partnerId);
    params.append('lang', 'pt-br');
    params.append('login_types', '[1,4,2]');
    params.append('max_auth_age', '3600');
    params.append('redirect_uri', 'https://open.shopee.com.br/api/v1/oauth2/callback');
    params.append('region', this.config.region);
    params.append('required_passwd', 'true');
    params.append('respond_code', 'code');
    params.append('scope', 'profile');
    params.append('sign', signature);
    params.append('state', stateEncoded);
    params.append('timestamp', timestamp.toString());
    params.append('title', 'CIP Shopee');

    // Construir a URL final
    let urlString = `${baseUrl}/signin/oauth/accountchooser?${params.toString()}`;
    
    console.log('URL de autorização final:', urlString);

    // Log detalhado dos parâmetros para diagnóstico
    console.log('PARÂMETROS DA URL DE AUTORIZAÇÃO:');
    console.log('- partner_id:', this.config.partnerId);
    console.log('- timestamp:', timestamp);
    console.log('- sign:', signature); // Verificar se a assinatura está sendo gerada
    console.log('- redirect:', this.config.redirectUrl);
    console.log('- auth_type:', 'direct');
    console.log('- auth_shop:', 'true');
    console.log('- login_type:', 'seller');

    // Log para verificar parâmetros na URL
    console.log('Verificando URL construída manualmente:');
    console.log('auth_type=shop presente:', urlString.includes('auth_type=shop'));
    console.log('auth_shop=true presente:', urlString.includes('auth_shop=true'));
    console.log('URL de redirecionamento incluída:', urlString.includes(encodeURIComponent(this.config.redirectUrl)));

    console.log('URL de autorização final:', urlString);

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

    // Verificar se auth_type=direct está presente e corrigir se necessário
    if (!urlString.includes('auth_type=direct')) {
      console.error("ERRO CRÍTICO: O parâmetro 'auth_type=direct' não está presente na URL!");
      console.error("URL problemática:", urlString);
      // Corrigir URL adicionando os parâmetros necessários
      urlString = `${urlString}&auth_type=direct&login_type=seller&region=BR&is_auth_shop=true`;
      console.log("URL corrigida com auth_type=direct:", urlString);
    }

    // Verificação extra: garantir que o parâmetro auth_type esteja no formato correto
    if (urlString.includes('auth_type=') && !urlString.includes('auth_type=direct')) {
      console.error("ERRO CRÍTICO: Parâmetro auth_type presente mas com valor incorreto!");
      // Substituir qualquer valor de auth_type por 'direct'
      urlString = urlString.replace(/auth_type=[^&]+/, 'auth_type=direct');
      console.log("URL corrigida com auth_type=direct:", urlString);
    }

    // Verificação adicional para caracteres inválidos no timestamp
    const invalidTimestampRegex = /[×xX]tamp=/;
    if (invalidTimestampRegex.test(urlString)) {
      console.error("ERRO CRÍTICO: Caractere inválido no parâmetro timestamp!");
      console.error("URL problemática:", urlString);
      // Correção automática do problema - agora funciona porque urlString é let
      urlString = urlString.replace(/[×xX]tamp=/, 'timestamp=');
      console.log("URL corrigida:", urlString);

      // Se o problema persistir, usar a abordagem manual como último recurso
      if (urlString.includes('×tamp=') || urlString.includes('xtamp=')) {
        console.log("Reconstruindo a URL manualmente como último recurso...");
        urlString = `${baseUrl}${basePathForShopAuthorize}?partner_id=${this.config.partnerId}&timestamp=${timestamp}&sign=${signature}&redirect=${encodeURIComponent(this.config.redirectUrl)}&state=${encodeURIComponent(stateParam)}&region=BR&is_auth_shop=true&login_type=seller&auth_type=direct&shop_id=`;
      }
    }

    // Log detalhado dos parâmetros obrigatórios para verificação
    console.log('URL FINAL COMPLETA (conforme documentação oficial):', urlString);
    console.log('Parâmetros obrigatórios presentes:');
    console.log('- partner_id=', urlString.includes(`partner_id=${this.config.partnerId}`));
    console.log('- timestamp=', urlString.includes('timestamp='));
    console.log('- sign=', urlString.includes('sign='));
    console.log('- redirect=', urlString.includes('redirect='));

    // Verificações adicionais para garantir que a URL está correta
    console.log('Verificação da URL completa:', urlString);
    console.log('Verificação do parâmetro timestamp (deve conter "timestamp="):', urlString.includes('timestamp='));

    // Verificação visual direta do timestamp para diagnóstico do problema
    console.log("🔎 Verificação direta do timestamp:", `timestamp=${timestamp}`);

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
    console.log(`Timestamp usado: ${timestamp}`);
    console.log(`Diferença de tempo atual: ${Math.floor(Date.now() / 1000) - timestamp} segundos`);
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