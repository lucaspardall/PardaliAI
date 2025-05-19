/**
 * Utilitários para a API da Shopee
 */
import crypto from 'crypto';
import qs from 'qs';
import { ShopeeAuthConfig } from './types';

/**
 * Gera o timestamp atual em segundos
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Calcula a assinatura baseada no método da Shopee
 * @param partnerId ID do parceiro
 * @param partnerKey Chave do parceiro
 * @param path Caminho da API
 * @param timestamp Timestamp em segundos
 * @param params Parâmetros adicionais (opcional)
 */
export function generateSignature(
  partnerId: string,
  partnerKey: string, 
  path: string, 
  timestamp: number,
  params?: Record<string, any>
): string {
  // Para API v2, a assinatura é baseada no seguinte formato:
  // {partner_id}{path}{timestamp}{access_token}{shop_id}{partner_key}
  let baseString = `${partnerId}${path}${timestamp}`;
  
  // Adicionar token de acesso, se fornecido nos parâmetros
  if (params?.access_token) {
    baseString += params.access_token;
  }
  
  // Adicionar shop_id, se fornecido nos parâmetros
  if (params?.shop_id) {
    baseString += params.shop_id;
  }
  
  // Adicionar a partner_key para finalizar a string base
  baseString += partnerKey;
  
  // Gerar hash usando HMAC SHA-256
  return crypto.createHash('sha256').update(baseString).digest('hex');
}

/**
 * Gera URL de autorização para o fluxo de OAuth
 */
export function generateAuthUrl(config: ShopeeAuthConfig): string {
  const timestamp = getTimestamp();
  const path = '/api/v2/shop/auth_partner';
  const signature = generateSignature(config.partnerId, config.partnerKey, path, timestamp);
  
  const baseUrl = getApiBaseUrl(config.region);
  const params = {
    partner_id: Number(config.partnerId),
    timestamp,
    sign: signature,
    redirect: config.redirectUrl,
  };
  
  return `${baseUrl}${path}?${qs.stringify(params)}`;
}

/**
 * Retorna a URL base da API para a região específica
 */
export function getApiBaseUrl(region: string): string {
  const baseUrls: Record<string, string> = {
    BR: 'https://open-api.shopee.com.br',
    SG: 'https://open-api.shopee.sg',
    MY: 'https://open-api.shopee.com.my',
    ID: 'https://open-api.shopee.co.id',
    TW: 'https://open-api.shopee.tw',
    VN: 'https://open-api.shopee.vn',
    TH: 'https://open-api.shopee.co.th',
    PH: 'https://open-api.shopee.ph',
    MX: 'https://open-api.shopee.mx',
    CO: 'https://open-api.shopee.com.co',
    CL: 'https://open-api.shopee.cl',
  };
  
  return baseUrls[region] || baseUrls.BR;
}

/**
 * Analisa e formata erros da API
 */
export function parseApiError(error: any): {
  status: number;
  error: string;
  message: string;
  requestId?: string;
} {
  // Se for um erro de resposta do Axios
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      error: data.error || 'API_ERROR',
      message: data.message || 'Unknown API error',
      requestId: data.request_id,
    };
  }
  
  // Se for um erro de timeout ou conexão
  if (error.request) {
    return {
      status: 0,
      error: 'CONNECTION_ERROR',
      message: 'Failed to connect to Shopee API',
    };
  }
  
  // Erro genérico
  return {
    status: 500,
    error: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error occurred',
  };
}