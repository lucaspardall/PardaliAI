/**
 * Cliente principal da API Shopee - Versão limpa e otimizada
 */
import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import { ShopeeAuthConfig, ShopeeAuthTokens, ShopeeApiResponse } from './types';
import { ShopeeAuthManager } from './auth';
import { generateSignature, getTimestamp, getApiBaseUrl, parseApiError } from './utils';
import { storage } from '../storage';
import { ShopeeCache } from './cache';

// Configuração unificada de rate limiting
const RATE_LIMITS = {
  DEFAULT: {
    maxConcurrent: 2,
    minTime: 1000,
    reservoir: 30,
    reservoirRefreshAmount: 30,
    reservoirRefreshInterval: 60 * 1000
  },
  MEDIA: {
    maxConcurrent: 1,
    minTime: 2000,
    reservoir: 10,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 60 * 1000
  }
};

export class ShopeeClient {
  private config: ShopeeAuthConfig;
  private authManager: ShopeeAuthManager;
  private axiosInstance: AxiosInstance;
  private limiter: Bottleneck;
  private mediaLimiter: Bottleneck;
  private tokens: ShopeeAuthTokens | null = null;

  constructor(config: ShopeeAuthConfig, tokens?: ShopeeAuthTokens) {
    this.config = config;
    this.authManager = new ShopeeAuthManager(config);
    this.tokens = tokens || null;

    // Configurar instância Axios
    this.axiosInstance = axios.create({
      baseURL: getApiBaseUrl(config.region, false),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Region': config.region
      }
    });

    // Configurar limitadores
    this.limiter = new Bottleneck(RATE_LIMITS.DEFAULT);
    this.mediaLimiter = new Bottleneck(RATE_LIMITS.MEDIA);

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(async (config) => {
      if (config.url?.includes('/auth/')) return config;

      if (!this.tokens) {
        throw new Error('Authentication required. Call connect() first.');
      }

      // Auto-refresh se necessário
      if (this.authManager.isTokenExpired(this.tokens.expiresAt)) {
        this.tokens = await this.refreshToken();
      }

      const timestamp = getTimestamp();
      const path = config.url || '';

      if (!config.params) config.params = {};

      config.params.partner_id = Number(this.config.partnerId);
      config.params.timestamp = timestamp;
      config.params.access_token = this.tokens.accessToken;
      config.params.shop_id = Number(this.tokens.shopId);

      const signature = generateSignature(
        this.config.partnerId,
        this.config.partnerKey,
        path,
        timestamp,
        { access_token: this.tokens.accessToken },
        { shop_id: this.tokens.shopId },
        ['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '') ? config.data : undefined
      );

      config.params.sign = signature;
      return config;
    });

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 403 && this.tokens) {
          try {
            this.tokens = await this.refreshToken();
            return this.axiosInstance(error.config);
          } catch (refreshError) {
            throw parseApiError(refreshError);
          }
        }
        throw parseApiError(error);
      }
    );
  }

  private async refreshToken(): Promise<ShopeeAuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const newTokens = await this.authManager.refreshAccessToken(
        this.tokens.refreshToken,
        this.tokens.shopId
      );

      await this.saveTokensToStorage(newTokens);
      return newTokens;
    } catch (error: any) {
      console.error('[Shopee Client] Token refresh failed:', error);
      this.tokens = null;
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  private async saveTokensToStorage(tokens: ShopeeAuthTokens): Promise<void> {
    try {
      const store = await storage.getStoreByShopId(tokens.shopId);
      if (store) {
        await storage.updateStore(store.id, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt
        });
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  getAuthorizationUrl(): string {
    return this.authManager.getAuthorizationUrl();
  }

  async connect(code: string, shopId: string): Promise<ShopeeAuthTokens> {
    if (!code || !shopId) {
      throw new Error('Authorization code and shop ID are required');
    }

    if (!/^[a-zA-Z0-9]+$/.test(code)) {
      throw new Error('Invalid authorization code format');
    }

    if (!/^\d+$/.test(shopId)) {
      throw new Error('Shop ID must be numeric');
    }

    try {
      const tokens = await this.authManager.getAccessToken(code, shopId);

      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Invalid tokens received from Shopee API');
      }

      this.tokens = tokens;
      await this.saveTokensToStorage(tokens);
      return tokens;
    } catch (error) {
      console.error('Shopee connection error:', error);
      throw parseApiError(error);
    }
  }

  async get<T>(endpoint: string, params: Record<string, any> = {}, useCache: boolean = true): Promise<T> {
    if (!this.tokens) {
      throw new Error('No valid tokens available');
    }

    // Check cache
    if (useCache && ShopeeCache) {
      const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
      const cached = ShopeeCache.get<T>(cacheKey);
      if (cached) return cached;
    }

    // Select appropriate limiter
    const limiter = endpoint.includes('/media_space/') ? this.mediaLimiter : this.limiter;

    try {
      const response = await limiter.schedule(() =>
        this.axiosInstance.get<ShopeeApiResponse<T>>(endpoint, { params })
      );

      const data = response.data;

      if (data.error) {
        throw { error: data.error, message: data.message, requestId: data.request_id };
      }

      if (data.response === undefined) {
        return {} as T;
      }

      // Cache result
      if (useCache && ShopeeCache) {
        const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
        let ttl = ShopeeCache.TTL.PRODUCT_DETAIL;

        if (endpoint.includes('/category/')) ttl = ShopeeCache.TTL.CATEGORIES;
        else if (endpoint.includes('/shop/')) ttl = ShopeeCache.TTL.SHOP_INFO;
        else if (endpoint.includes('/order/')) ttl = ShopeeCache.TTL.ORDER_LIST;

        ShopeeCache.set(cacheKey, data.response, ttl);
      }

      return data.response;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  async post<T>(endpoint: string, data: Record<string, any>, params: Record<string, any> = {}): Promise<T> {
    const limiter = endpoint.includes('/media_space/') ? this.mediaLimiter : this.limiter;

    try {
      const response = await limiter.schedule(() =>
        this.axiosInstance.post<ShopeeApiResponse<T>>(endpoint, data, { params })
      );

      const responseData = response.data;

      if (responseData.error) {
        throw {
          error: responseData.error,
          message: responseData.message,
          requestId: responseData.request_id
        };
      }

      // Invalidate related cache
      if (endpoint.includes('/product/') && data.item_id && this.tokens?.shopId) {
        ShopeeCache?.invalidateProductCache(this.tokens.shopId, data.item_id);
      }

      return responseData.response;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  isConnected(): boolean {
    return !!this.tokens?.accessToken && 
           !!this.tokens?.refreshToken && 
           !this.authManager.isTokenExpired(this.tokens.expiresAt);
  }

  async validateConnection(): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      await this.get('/api/v2/shop/get_shop_info', {}, false);
      return true;
    } catch {
      return false;
    }
  }

  getConnectionStatus() {
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

  setTokens(tokens: ShopeeAuthTokens): void {
    this.tokens = tokens;
  }

  getTokens(): ShopeeAuthTokens | null {
    return this.tokens;
  }
}