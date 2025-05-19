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
  maxConcurrent: 3,    // Máximo de solicitações simultâneas
  minTime: 1000,       // Tempo mínimo entre solicitações (1 segundo)
  reservoir: 50,       // Número máximo de solicitações por minuto
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000, // 1 minuto
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
   */
  private async refreshToken(): Promise<ShopeeAuthTokens> {
    if (!this.tokens) {
      throw new Error('No refresh token available');
    }
    
    const newTokens = await this.authManager.refreshAccessToken(
      this.tokens.refreshToken,
      this.tokens.shopId
    );
    
    // Persistir novos tokens
    try {
      await this.saveTokensToStorage(newTokens);
    } catch (error) {
      console.error('Failed to save refreshed tokens to storage:', error);
    }
    
    return newTokens;
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
   * Faz uma requisição GET à API da Shopee
   * @param endpoint Endpoint da API
   * @param params Parâmetros da requisição (opcionais)
   */
  async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await this.limiter.schedule(() => 
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
      
      return data.response;
    } catch (error) {
      throw parseApiError(error);
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
      const response = await this.limiter.schedule(() => 
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
      
      return responseData.response;
    } catch (error) {
      throw parseApiError(error);
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