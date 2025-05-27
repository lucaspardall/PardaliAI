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
 * Obtém URL base da API baseada na região
 */
export function getApiBaseUrl(region: ShopeeRegion): string {
  const urls = {
    'SG': 'https://partner.shopeemobile.com',
    'MY': 'https://partner.shopeemobile.com',
    'TH': 'https://partner.shopeemobile.com',
    'TW': 'https://partner.shopeemobile.com',
    'ID': 'https://partner.shopeemobile.com',
    'VN': 'https://partner.shopeemobile.com',
    'PH': 'https://partner.shopeemobile.com',
    'BR': 'https://partner.shopeemobile.com',
    'MX': 'https://partner.shopeemobile.com',
    'CO': 'https://partner.shopeemobile.com',
    'CL': 'https://partner.shopeemobile.com',
    'PL': 'https://partner.shopeemobile.com',
    'ES': 'https://partner.shopeemobile.com',
    'FR': 'https://partner.shopeemobile.com'
  };

  return urls[region] || 'https://partner.shopeemobile.com';
}

/**
 * Gera assinatura HMAC-SHA256 para requisições da API Shopee
 */
export function generateSignature(
  partnerId: string,
  partnerKey: string,
  path: string,
  timestamp: number,
  accessToken?: string,
  shopId?: string,
  requestBody?: any
): string {
  let baseString = `${partnerId}${path}${timestamp}`;

  // Adicionar access_token e shop_id se fornecidos
  if (accessToken && shopId) {
    baseString += `${accessToken}${shopId}`;
  }

  // Adicionar corpo da requisição se fornecido
  if (requestBody) {
    const bodyString = typeof requestBody === 'string' 
      ? requestBody 
      : JSON.stringify(requestBody);
    baseString += bodyString;
  }

  console.log('🔐 Gerando assinatura com base string:', baseString);

  const hmac = crypto.createHmac('sha256', partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');

  console.log('✅ Assinatura gerada:', signature);

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