/**
 * Cliente principal da API Shopee
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Bottleneck from 'bottleneck';
import { ShopeeAuthConfig, ShopeeAuthTokens, ShopeeApiResponse } from './types';
import { ShopeeAuthManager } from './auth';
import { generateSignature, getTimestamp, getApiBaseUrl, parseApiError } from './utils';
import { storage } from '../storage';

// Configurações de limitação de taxa padrão
const DEFAULT_RATE_LIMIT = {
  maxConcurrent: 3,             // Máximo de solicitações simultâneas
  minTime: 1000,                // Tempo mínimo entre solicitações (1 segundo)
  reservoir: 50,                // Número máximo de solicitações por minuto
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000, // 1 minuto
  highWater: 80,                // 80% da capacidade antes de começar a retardar
  strategy: Bottleneck.strategy.LEAK, // Estratégia de vazamento gradual
  retryAfter: 60 * 1000,        // Tempo de espera após erro de rate limit (1 minuto)
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
    
    // Criar instância do Axios
    this.axiosInstance = axios.create({
      baseURL: getApiBaseUrl(config.region),
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
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
      
      // Gerar assinatura
      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        path,
        timestamp,
        { 
          access_token: this.tokens.accessToken,
          shop_id: this.tokens.shopId,
        }
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
    
    try {
      // Obter novos tokens
      const newTokens = await this.authManager.refreshAccessToken(
        this.tokens.refreshToken,
        this.tokens.shopId
      );
      
      // Verificar se obtivemos novos tokens válidos
      if (!newTokens.accessToken || !newTokens.refreshToken) {
        throw new Error('Invalid tokens received during refresh');
      }
      
      // Atualizar tokens em memória imediatamente
      this.tokens = newTokens;
      
      // Persistir novos tokens
      await this.saveTokensToStorage(newTokens);
      
      console.log(`Tokens refreshed successfully for shop ${newTokens.shopId}`);
      
      return newTokens;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      
      // Em caso de falha, podemos precisar forçar nova autenticação
      this.tokens = null;
      
      throw new Error(`Token refresh failed: ${error.message || 'Unknown error'}`);
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
   * Gera uma URL de autorização para iniciar o fluxo OAuth
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
      const tokens = await this.authManager.getAccessToken(code, shopId);
      this.tokens = tokens;
      
      // Salvar os tokens no armazenamento
      await this.saveTokensToStorage(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Failed to connect with Shopee:', error);
      throw error;
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
   */
  async get<T>(endpoint: string, params: Record<string, any> = {}, useCache: boolean = true): Promise<T> {
    try {
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
      
      if (data.error) {
        throw {
          error: data.error,
          message: data.message,
          requestId: data.request_id,
        };
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
    } catch (error) {
      // Tratamento especial para erro de limite de taxa
      const apiError = parseApiError(error);
      
      if (apiError.error === 'TooManyRequests' || 
          (error.response?.status === 429) || 
          apiError.message?.includes('rate limit')) {
        console.warn(`[Shopee API] Rate limit hit for ${endpoint}. Retrying after delay.`);
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Tentar novamente com cache desabilitado para garantir resposta fresca
        return this.get(endpoint, params, false);
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
    return !!this.tokens && !this.authManager.isTokenExpired(this.tokens.expiresAt);
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
}