/**
 * Utilitários para a API da Shopee
 */
import crypto from 'crypto';
import { ShopeeRegion } from './types';

/**
 * Obtém timestamp atual em segundos
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Obtém a URL base da API conforme a região
 */
export function getApiBaseUrl(region: ShopeeRegion, isAuth: boolean = false): string {
  // CORREÇÃO: URLs específicas para Brasil
  if (region === 'BR') {
    if (isAuth) {
      // URL de autenticação para Brasil
      return 'https://partner.shopeemobile.com';
    } else {
      // URL da API para Brasil
      return 'https://partner.shopeemobile.com';
    }
  }

  // Para outras regiões, manter comportamento atual
  const baseUrl = 'https://partner.shopeemobile.com';
  return baseUrl;
}

/**
 * Gera assinatura HMAC-SHA256 para requisições da API Shopee
 */
export function generateSignature(
  partnerId: string,
  partnerKey: string,
  path: string,
  timestamp: number,
  accessToken?: Record<string, string>,
  shopId?: Record<string, string>,
  body?: any
): string {
  // CORREÇÃO: Basestring exata conforme documentação Shopee
  // Formato: {partner_id}{path}{timestamp}{access_token}{shop_id}{request_body}

  let baseString = `${partnerId}${path}${timestamp}`;

  // Adicionar access_token se fornecido (SEM chaves extras)
  if (accessToken?.access_token) {
    baseString += accessToken.access_token;
  }

  // Adicionar shop_id se fornecido (SEM chaves extras)
  if (shopId?.shop_id) {
    baseString += shopId.shop_id;
  }

  // Adicionar corpo da requisição se fornecido (JSON compacto, sem espaços)
  if (body) {
    // IMPORTANTE: JSON deve ser minificado (sem espaços)
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    baseString += bodyString;
  }

  console.log(`[Shopee Auth] Base string: ${baseString}`);

  // Gerar HMAC-SHA256
  const hmac = crypto.createHmac('sha256', partnerKey);
  hmac.update(baseString, 'utf8');
  const signature = hmac.digest('hex');

  console.log(`[Shopee Auth] Generated signature: ${signature}`);
  return signature;
}

/**
 * Parseia erros da API da Shopee
 */
export function parseApiError(error: any): Error {
  if (error.response?.data) {
    const data = error.response.data;
    return new Error(`Shopee API Error: ${data.message || data.error || 'Unknown error'}`);
  }

  if (error.code === 'ECONNREFUSED') {
    return new Error('Connection refused - API endpoint may be unreachable');
  }

  if (error.code === 'ETIMEDOUT') {
    return new Error('Request timeout - API took too long to respond');
  }

  return new Error(error.message || 'Unknown error occurred');
}
/**
 * Utilitários para API Shopee
 */
import crypto from 'crypto';
import { ShopeeRegion } from './types';
import { API_BASE_URLS, AUTH_BASE_URLS } from './config';

/**
 * Gera timestamp Unix atual
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Gera assinatura HMAC-SHA256 para requisições Shopee
 */
export function generateSignature(
  partnerId: string,
  partnerKey: string,
  path: string,
  timestamp: number,
  accessToken?: { access_token: string },
  shopId?: { shop_id: string },
  body?: any
): string {
  // Construir string base para assinatura
  let baseString = `${partnerId}${path}${timestamp}`;

  // Adicionar access_token se fornecido
  if (accessToken) {
    baseString += accessToken.access_token;
  }

  // Adicionar shop_id se fornecido
  if (shopId) {
    baseString += shopId.shop_id;
  }

  // Adicionar body se fornecido (para POST/PUT/PATCH)
  if (body) {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    baseString += bodyString;
  }

  // Gerar HMAC-SHA256
  return crypto
    .createHmac('sha256', partnerKey)
    .update(baseString)
    .digest('hex');
}

/**
 * Obtém URL base da API para região
 */
export function getApiBaseUrl(region: ShopeeRegion, isAuth: boolean = false): string {
  return isAuth ? AUTH_BASE_URLS[region] : API_BASE_URLS[region];
}

/**
 * Parse erros da API Shopee
 */
export function parseApiError(error: any): Error {
  if (error.response?.data) {
    const data = error.response.data;
    return new Error(`Shopee API Error: ${data.message || data.error || 'Unknown error'}`);
  }
  
  if (error.message) {
    return new Error(error.message);
  }
  
  return new Error('Unknown API error');
}

/**
 * Valida formato de Shop ID
 */
export function validateShopId(shopId: string): boolean {
  return /^\d+$/.test(shopId);
}

/**
 * Valida formato de código de autorização
 */
export function validateAuthCode(code: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(code);
}

/**
 * Converte timestamp Unix para Date
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Sanitiza dados para log (remove tokens sensíveis)
 */
export function sanitizeForLog(data: any): any {
  const sanitized = { ...data };
  
  if (sanitized.access_token) {
    sanitized.access_token = '***';
  }
  
  if (sanitized.refresh_token) {
    sanitized.refresh_token = '***';
  }
  
  if (sanitized.sign) {
    sanitized.sign = '***';
  }
  
  return sanitized;
}
