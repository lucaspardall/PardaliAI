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