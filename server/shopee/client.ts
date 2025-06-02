/**
 * Cliente HTTP base para API da Shopee
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

export interface ShopeeClientConfig {
  partnerId: string;
  partnerKey: string;
  shopId?: string;
  accessToken?: string;
  region?: string;
  baseURL?: string;
}

export class ShopeeClient {
  private client: AxiosInstance;
  private config: ShopeeClientConfig;

  constructor(config: ShopeeClientConfig) {
    this.config = config;

    // Configurar cliente axios com timeout e retry
    this.client = axios.create({
      baseURL: config.baseURL || 'https://partner.shopeemobile.com',
      timeout: 8000, // 8 segundos
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CIP-Shopee-Client/1.0'
      },
      // Prevenir referência circular
      transformRequest: [
        (data) => {
          if (typeof data === 'object' && data !== null) {
            return JSON.stringify(data);
          }
          return data;
        }
      ],
      transformResponse: [
        (data) => {
          try {
            return JSON.parse(data);
          } catch {
            return data;
          }
        }
      ]
    });

    // Interceptor para logs (sem circular)
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[ShopeeClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[ShopeeClient] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Interceptor com retry automático
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[ShopeeClient] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      async (error) => {
        const config = error.config;
        
        // Implementar retry com backoff exponencial
        if (!config || config.__retryCount >= 3) {
          console.error('[ShopeeClient] Response error (max retries):', {
            url: config?.url,
            status: error.response?.status,
            message: error.message
          });
          return Promise.reject(error);
        }
        
        config.__retryCount = config.__retryCount || 0;
        config.__retryCount += 1;
        
        // Delay exponencial: 1s, 2s, 4s
        const delay = Math.pow(2, config.__retryCount - 1) * 1000;
        
        console.log(`[ShopeeClient] Retry ${config.__retryCount}/3 after ${delay}ms for ${config.url}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.client.request(config);
      }
    );
  }

  /**
   * Gera assinatura HMAC para requisição
   */
  private generateSignature(path: string, timestamp: number, body?: string): string {
    const baseString = `${this.config.partnerId}${path}${timestamp}${this.config.accessToken || ''}${body || ''}`;

    return crypto
      .createHmac('sha256', this.config.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  /**
   * Requisição GET
   */
  async get(path: string, params?: Record<string, any>): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(path, timestamp);

    const queryParams = {
      partner_id: this.config.partnerId,
      timestamp,
      sign: signature,
      ...(this.config.accessToken && { access_token: this.config.accessToken }),
      ...(this.config.shopId && { shop_id: this.config.shopId }),
      ...(params || {})
    };

    try {
      const response = await this.client.get(path, { 
        params: queryParams,
        timeout: 30000
      });

      return response.data;
    } catch (error: any) {
      console.error(`[ShopeeClient] GET ${path} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Requisição POST
   */
  async post(path: string, data?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = data ? JSON.stringify(data) : '';
    const signature = this.generateSignature(path, timestamp, body);

    const queryParams = {
      partner_id: this.config.partnerId,
      timestamp,
      sign: signature,
      ...(this.config.accessToken && { access_token: this.config.accessToken }),
      ...(this.config.shopId && { shop_id: this.config.shopId })
    };

    try {
      const response = await this.client.post(path, data || {}, {
        params: queryParams,
        timeout: 30000
      });

      return response.data;
    } catch (error: any) {
      console.error(`[ShopeeClient] POST ${path} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Atualizar token de acesso
   */
  updateAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
  }

  /**
   * Definir tokens de autenticação
   */
  setTokens(tokens: { accessToken: string; refreshToken: string; expiresAt: Date; shopId: string }): void {
    this.config.accessToken = tokens.accessToken;
    this.config.shopId = tokens.shopId;
  }

  /**
   * Definir headers customizados
   */
  setRequestHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers.common, headers);
  }

  /**
   * Validar conexão com a API
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.get('/api/v2/shop/get_shop_info');
      return !response.error;
    } catch (error) {
      console.error('[ShopeeClient] Connection validation failed:', error);
      return false;
    }
  }

  /**
   * Obter configuração atual (sem dados sensíveis)
   */
  getConfig(): Partial<ShopeeClientConfig> {
    return {
      partnerId: this.config.partnerId,
      shopId: this.config.shopId,
      region: this.config.region,
      baseURL: this.config.baseURL
    };
  }
}

/**
 * Cria um cliente Shopee com configuração padrão
 */
export function createShopeeClient(config: ShopeeClientConfig): ShopeeClient {
  return new ShopeeClient({
    baseURL: 'https://partner.shopeemobile.com',
    region: 'BR',
    ...config
  });
}