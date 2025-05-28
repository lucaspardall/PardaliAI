/**
 * Cliente principal da API Shopee
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Bottleneck from 'bottleneck';
import { ShopeeAuthConfig, ShopeeAuthTokens, ShopeeApiResponse } from './types';
import { ShopeeAuthManager } from './auth';
import { generateSignature, getTimestamp, getApiBaseUrl, parseApiError } from './utils';
import { storage } from '../storage';
import { ShopeeCache } from './cache';

// Configurações de limitação de taxa otimizadas para produção
const DEFAULT_RATE_LIMIT = {
  maxConcurrent: 5,             // Mais concorrência para produção
  minTime: 800,                 // Tempo reduzido para melhor performance
  reservoir: 100,               // Mais solicitações por minuto em produção
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000, // 1 minuto
  highWater: 90,                // 90% da capacidade antes de retardar
  strategy: Bottleneck.strategy.LEAK,
  retryAfter: 30 * 1000,        // Tempo de espera reduzido (30 segundos)
};

// Limitadores separados para diferentes tipos de operações
const LIMITERS = {
  READ: new Bottleneck({
    ...DEFAULT_RATE_LIMIT,
    reservoir: 80,              // Mais permissivo para operações de leitura
    reservoirRefreshAmount: 80,
  }),
  WRITE: new Bottleneck({
    ...DEFAULT_RATE_LIMIT,
    reservoir: 30,              // Mais restritivo para operações de escrita
    reservoirRefreshAmount: 30,
  }),
  MEDIA: new Bottleneck({
    ...DEFAULT_RATE_LIMIT,
    reservoir: 20,              // Ainda mais restritivo para uploads de mídia
    reservoirRefreshAmount: 20,
    maxConcurrent: 2,           // Limitar uploads simultâneos
  }),
};

/**
 * Cliente para a API da Shopee
 */
export class ShopeeClient {
  private config: ShopeeAuthConfig;
  private authManager: ShopeeAuthManager;
  private axiosInstance: AxiosInstance;
  private limiter: Bottleneck;
  private tokens: ShopeeAuthTokens | null = null;

  /**
   * Inicializa o cliente da API Shopee
   * @param config Configuração para autenticação
   * @param tokens Tokens de acesso (opcional, caso já tenha)
   */
  constructor(config: ShopeeAuthConfig, tokens?: ShopeeAuthTokens) {
    this.config = config;
    this.authManager = new ShopeeAuthManager(config);
    this.tokens = tokens || null;

    // Verificar se a URL de redirecionamento está definida
    if (!config.redirectUrl) {
      console.error('ERRO: URL de redirecionamento não definida na configuração');
      config.redirectUrl = 'https://cipshopee.replit.app/api/shopee/callback';
    }

    // Criar instância do Axios otimizada para produção
    this.axiosInstance = axios.create({
      baseURL: getApiBaseUrl(config.region, false), // Sempre usa o domínio partner.shopeemobile.com
      timeout: 45000, // 45 segundos para produção (mais tempo para rede instável)
      headers: {
        'Content-Type': 'application/json',
        'X-Region': config.region,
        'X-Shopee-Region': config.region,
        // Headers específicos para Brasil
        ...(config.region === 'BR' && {
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'X-Shopee-Country': 'BR'
        })
      },
    });

    // Configurar limitador de taxa
    this.limiter = new Bottleneck(DEFAULT_RATE_LIMIT);

    // Adicionar interceptadores para autenticação e renovação automática de token
    this.setupInterceptors();
  }

  /**
   * Configura interceptadores para adicionar parâmetros de autenticação e lidar com erros
   */
  private setupInterceptors() {
    // Interceptador de requisição
    this.axiosInstance.interceptors.request.use(async (config) => {
      // Não aplicar interceptação nas URLs de autenticação
      if (config.url?.includes('/auth/')) {
        return config;
      }

      // Se não tivermos tokens, não podemos fazer requisições
      if (!this.tokens) {
        throw new Error('Authentication required. Call connect() first.');
      }

      // Verificar se o token está expirado e renovar se necessário
      if (this.authManager.isTokenExpired(this.tokens.expiresAt)) {
        try {
          this.tokens = await this.refreshToken();
        } catch (error) {
          throw new Error('Failed to refresh access token');
        }
      }

      const timestamp = getTimestamp();
      const path = config.url || '';

      // Adicionar parâmetros comuns
      if (!config.params) {
        config.params = {};
      }

      config.params.partner_id = Number(this.config.partnerId);
      config.params.timestamp = timestamp;
      config.params.access_token = this.tokens.accessToken;
      config.params.shop_id = Number(this.tokens.shopId);

      // Gerar assinatura com base no método
      // Se for POST, PUT, PATCH, incluir o corpo na geração da assinatura
      const requestBody = ['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '') ? config.data : undefined;

      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        path,
        timestamp,
        { 
          access_token: this.tokens.accessToken 
        },
        { 
          shop_id: this.tokens.shopId 
        },
        requestBody
      );

      config.params.sign = signature;

      return config;
    });

    // Interceptador de resposta para tratamento de erros
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Se for erro de token expirado e tivermos tokens, tente renovar
        if (error.response?.status === 403 && 
            error.response?.data?.error?.includes('auth') && 
            this.tokens) {
          try {
            this.tokens = await this.refreshToken();
            // Repetir a requisição original com o novo token
            const originalRequest = error.config;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            throw parseApiError(refreshError);
          }
        }

        throw parseApiError(error);
      }
    );
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   * Conforme documentação, refresh_token pode ser usado apenas uma vez
   * e cada chamada retorna um novo refresh_token
   */
  private async refreshToken(): Promise<ShopeeAuthTokens> {
    if (!this.tokens) {
      throw new Error('No refresh token available');
    }

    // Verificar se o refresh token ainda é válido (não expirou)
    if (!this.tokens.refreshToken) {
      throw new Error('Refresh token is missing');
    }

    try {
      console.log(`[Shopee Auth] Refreshing token for shop ${this.tokens.shopId}`);

      // Obter novos tokens
      const newTokens = await this.authManager.refreshAccessToken(
        this.tokens.refreshToken,
        this.tokens.shopId
      );

      // Validar tokens recebidos
      if (!newTokens.accessToken || !newTokens.refreshToken) {
        throw new Error('Invalid tokens received during refresh - missing access_token or refresh_token');
      }

      // Validar shopId
      if (newTokens.shopId !== this.tokens.shopId) {
        throw new Error('Shop ID mismatch in refreshed tokens');
      }

      // Atualizar tokens em memória imediatamente
      this.tokens = newTokens;

      // Persistir novos tokens no armazenamento
      try {
        await this.saveTokensToStorage(newTokens);
        console.log(`[Shopee Auth] Tokens refreshed and saved successfully for shop ${newTokens.shopId}`);
      } catch (saveError) {
        console.error(`[Shopee Auth] Failed to save refreshed tokens:`, saveError);
        // Não falhar aqui, pois os tokens em memória ainda são válidos
      }

      return newTokens;
    } catch (error: any) {
      console.error(`[Shopee Auth] Failed to refresh access token:`, error);

      // Determinar se é um erro recuperável ou não
      const isRecoverable = error.response?.status !== 400 && 
                           !error.message?.includes('invalid_grant') &&
                           !error.message?.includes('invalid refresh token');

      if (!isRecoverable) {
        // Em caso de erro não recuperável, limpar tokens para forçar nova autenticação
        console.warn(`[Shopee Auth] Refresh token invalid, clearing tokens for shop ${this.tokens.shopId}`);
        this.tokens = null;
      }

      const errorMessage = error.response?.data?.message || error.message || 'Unknown refresh error';
      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Salva tokens no armazenamento
   */
  private async saveTokensToStorage(tokens: ShopeeAuthTokens): Promise<void> {
    try {
      const store = await storage.getStoreByShopId(tokens.shopId);

      if (store) {
        await storage.updateStore(store.id, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
        });
      }
    } catch (error) {
      console.error('Error saving tokens to storage:', error);
      throw error;
    }
  }

  /**
   * Obtém a URL para iniciar o processo de autorização OAuth
   * Utilizando o método atualizado que usa o domínio account.seller.shopee.com
   */
  getAuthorizationUrl(): string {
    return this.authManager.getAuthorizationUrl();
  }

  /**
   * Completa o fluxo OAuth após receber o código de autorização
   * @param code Código recebido do redirecionamento OAuth
   * @param shopId ID da loja
   */
  async connect(code: string, shopId: string): Promise<ShopeeAuthTokens> {
    try {
      console.log(`Iniciando conexão com a Shopee para código: ${code} e shopId: ${shopId}`);

      // Validar parâmetros
      if (!code || !shopId) {
        throw new Error("Código de autorização e ID da loja são obrigatórios");
      }

      // Log detalhado para diagnóstico
      console.log(`Tentando obter token com código: ${code.substring(0, 5)}... (parcialmente oculto)`);
      console.log(`ID da loja: ${shopId}`);
      console.log(`Timestamp atual: ${Math.floor(Date.now() / 1000)}`);

      // Verificar se o código está no formato esperado (alfanumérico)
      if (!/^[a-zA-Z0-9]+$/.test(code)) {
        console.error("ERRO: Código de autorização em formato inválido:", code);
        throw new Error("Formato de código de autorização inválido");
      }

      // Verificar se o shopId é numérico (como esperado pela API Shopee)
      if (!/^\d+$/.test(shopId)) {
        console.error("ERRO: ID da loja deve ser numérico:", shopId);
        throw new Error("ID da loja deve ser um número");
      }

      // Obter tokens de acesso
      const tokens = await this.authManager.getAccessToken(code, shopId);

      // Verificar se recebemos tokens válidos
      if (!tokens.accessToken || !tokens.refreshToken) {
        console.error("Tokens inválidos recebidos da API Shopee:", tokens);
        throw new Error("Tokens inválidos retornados pela API da Shopee");
      }

      // Atualizar tokens na instância
      this.tokens = tokens;

      console.log(`Tokens obtidos com sucesso: ${JSON.stringify({
        accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 5)}...` : undefined,
        refreshToken: tokens.refreshToken ? `${tokens.refreshToken.substring(0, 5)}...` : undefined,
        expiresAt: tokens.expiresAt,
        shopId: tokens.shopId
      })}`);

      // Salvar os tokens no armazenamento imediatamente
      await this.saveTokensToStorage(tokens);

      return tokens;
    } catch (error) {
      console.error(`Erro ao conectar com a Shopee: ${error.message}`, error);

      // Tratar erros conforme documentação
      const apiError = parseApiError(error);

      // Erros comuns mencionados na documentação
      if (apiError.error === 'TokenNotFound' || 
          apiError.message?.includes('token not found') || 
          apiError.message?.includes('Invalid code') ||
          (apiError.response && apiError.response.errcode === 2)) {
        console.error("ERRO CRÍTICO: Token/código não encontrado ou inválido. O código de autorização pode ter expirado.");
        console.error("De acordo com a documentação, o código é válido por apenas 10 minutos.");
        console.error("Solução: O usuário precisa iniciar o fluxo de autorização novamente.");
      } else if (apiError.message?.includes('Invalid timestamp') || apiError.message?.includes('Wrong sign')) {
        console.error("ERRO DE ASSINATURA/TIMESTAMP: Verifique se o timestamp está dentro da validade (5 minutos) e se a assinatura está correta.");
      }

      throw apiError;
    }
  }

  /**
   * Determina qual limitador usar com base no endpoint
   * @param endpoint Endpoint da API
   * @param method Método HTTP
   */
  private getLimiter(endpoint: string, method: string): Bottleneck {
    // Endpoints de mídia usam o limitador de mídia
    if (endpoint.includes('/media_space/')) {
      return LIMITERS.MEDIA;
    }

    // Operações POST, PUT, DELETE são consideradas escrita
    if (method !== 'GET') {
      return LIMITERS.WRITE;
    }

    // Por padrão, usa o limitador de leitura
    return LIMITERS.READ;
  }

  /**
   * Faz uma requisição GET à API da Shopee
   * @param endpoint Endpoint da API
   * @param params Parâmetros da requisição (opcionais)
   * @param useCache Se deve usar cache (padrão: true)
   * @param retryCount Contador interno de tentativas
   */
  async get<T>(endpoint: string, params: Record<string, any> = {}, useCache: boolean = true, retryCount: number = 0): Promise<T> {
    const maxRetries = 3;
    
    try {
      // Verificar se não temos tokens válidos
      if (!this.tokens) {
        throw new Error('No valid tokens available. Please authenticate first.');
      }

      // Verificar cache se habilitado
      if (useCache && ShopeeCache) {
        const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
        const cachedData = ShopeeCache.get<T>(cacheKey);

        if (cachedData) {
          console.log(`[Shopee API] Cache hit for ${endpoint}`);
          return cachedData;
        }
      }

      // Selecionar o limitador apropriado
      const limiter = this.getLimiter(endpoint, 'GET');

      // Fazer a requisição com controle de taxa
      const response = await limiter.schedule(() => 
        this.axiosInstance.get<ShopeeApiResponse<T>>(endpoint, { params })
      );

      const data = response.data;

      // Verificar se há erro na resposta
      if (data.error) {
        throw {
          error: data.error,
          message: data.message || 'API Error',
          requestId: data.request_id,
          response: data
        };
      }

      // Verificar se há response válida
      if (data.response === undefined || data.response === null) {
        console.warn(`[Shopee API] Empty response for ${endpoint}`);
        return {} as T;
      }

      // Armazenar em cache se habilitado
      if (useCache && ShopeeCache) {
        const cacheKey = `${endpoint}:${JSON.stringify(params)}`;

        // Determinar TTL apropriado com base no endpoint
        let ttl = ShopeeCache.TTL.PRODUCT_DETAIL;
        if (endpoint.includes('/category/')) ttl = ShopeeCache.TTL.CATEGORIES;
        else if (endpoint.includes('/attributes/')) ttl = ShopeeCache.TTL.ATTRIBUTES;
        else if (endpoint.includes('/shop/')) ttl = ShopeeCache.TTL.SHOP_INFO;
        else if (endpoint.includes('/order/')) ttl = ShopeeCache.TTL.ORDER_LIST;

        ShopeeCache.set(cacheKey, data.response, ttl);
      }

      return data.response;
    } catch (error: any) {
      console.error(`[Shopee API] Error in GET ${endpoint}:`, error);

      // Parse do erro
      const apiError = parseApiError(error);

      // Tratamento para rate limiting
      if (apiError.error === 'TooManyRequests' || 
          error.response?.status === 429 || 
          apiError.message?.includes('rate limit')) {
        
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
          console.warn(`[Shopee API] Rate limit hit for ${endpoint}. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.get(endpoint, params, false, retryCount + 1);
        }
      }

      // Tratamento para erro de autenticação
      if (error.response?.status === 403 || error.response?.status === 401) {
        if (this.tokens && retryCount === 0) {
          try {
            console.log(`[Shopee API] Token expired, refreshing...`);
            this.tokens = await this.refreshToken();
            return this.get(endpoint, params, useCache, retryCount + 1);
          } catch (refreshError) {
            console.error(`[Shopee API] Failed to refresh token:`, refreshError);
            throw new Error('Authentication failed. Please re-authenticate.');
          }
        }
      }

      throw apiError;
    }
  }

  /**
   * Faz uma requisição POST à API da Shopee
   * @param endpoint Endpoint da API
   * @param data Dados da requisição
   * @param params Parâmetros de query (opcionais)
   */
  async post<T>(endpoint: string, data: Record<string, any>, params: Record<string, any> = {}): Promise<T> {
    try {
      // Selecionar o limitador apropriado
      const limiter = this.getLimiter(endpoint, 'POST');

      // Fazer a requisição com controle de taxa
      const response = await limiter.schedule(() => 
        this.axiosInstance.post<ShopeeApiResponse<T>>(endpoint, data, { params })
      );

      const responseData = response.data;

      if (responseData.error) {
        throw {
          error: responseData.error,
          message: responseData.message,
          requestId: responseData.request_id,
        };
      }

      // Para operações de modificação, invalidar caches relacionados
      if (endpoint.includes('/product/') && data.item_id) {
        if (this.tokens?.shopId) {
          ShopeeCache?.invalidateProductCache(this.tokens.shopId, data.item_id);
        }
      }

      return responseData.response;
    } catch (error) {
      // Tratamento especial para erro de limite de taxa
      const apiError = parseApiError(error);

      if (apiError.error === 'TooManyRequests' || 
          (error.response?.status === 429) || 
          apiError.message?.includes('rate limit')) {
        console.warn(`[Shopee API] Rate limit hit for ${endpoint}. Retrying after delay.`);

        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Tentar novamente
        return this.post(endpoint, data, params);
      }

      throw apiError;
    }
  }

  /**
   * Verifica se o cliente está conectado
   */
  isConnected(): boolean {
    return !!this.tokens && 
           !!this.tokens.accessToken && 
           !!this.tokens.refreshToken && 
           !this.authManager.isTokenExpired(this.tokens.expiresAt);
  }

  /**
   * Valida a conexão fazendo uma requisição de teste
   */
  async validateConnection(): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      // Fazer uma requisição simples para validar os tokens
      await this.get('/api/v2/shop/get_shop_info', {}, false);
      return true;
    } catch (error) {
      console.warn(`[Shopee Client] Connection validation failed:`, error);
      return false;
    }
  }

  /**
   * Obtém informações detalhadas do status da conexão
   */
  getConnectionStatus(): {
    connected: boolean;
    hasTokens: boolean;
    tokenExpired: boolean;
    shopId?: string;
    expiresAt?: Date;
  } {
    const hasTokens = !!this.tokens?.accessToken && !!this.tokens?.refreshToken;
    const tokenExpired = this.tokens ? this.authManager.isTokenExpired(this.tokens.expiresAt) : true;
    
    return {
      connected: this.isConnected(),
      hasTokens,
      tokenExpired,
      shopId: this.tokens?.shopId,
      expiresAt: this.tokens?.expiresAt
    };
  }

  /**
   * Define tokens manualmente (útil quando carregando de armazenamento)
   */
  setTokens(tokens: ShopeeAuthTokens): void {
    this.tokens = tokens;
  }

  /**
   * Retorna os tokens atuais
   */
  getTokens(): ShopeeAuthTokens | null {
    return this.tokens;
  }

  /**
   * Define headers personalizados para requisições
   * Útil para adicionar headers específicos do Brasil
   */
  setRequestHeaders(headers: Record<string, string>): void {
    // Atualizar headers da instância do Axios
    Object.entries(headers).forEach(([key, value]) => {
      this.axiosInstance.defaults.headers.common[key] = value;
    });
    console.log('Headers personalizados configurados:', headers);
  }
}