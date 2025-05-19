/**
 * Funções utilitárias para a API da Shopee
 */
import { createHmac } from 'crypto';
import { ShopeeRegion, ShopeeApiError } from './types';

/**
 * Gera um timestamp UNIX em segundos
 * @returns Timestamp atual em segundos
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Obtém a URL base da API de acordo com a região
 * @param region Região da Shopee
 * @returns URL base da API
 */
export function getApiBaseUrl(region: ShopeeRegion): string {
  const regionMap: Record<ShopeeRegion, string> = {
    'SG': 'https://partner.shopeemobile.com',
    'MY': 'https://partner.shopeemobile.com',
    'TH': 'https://partner.shopeemobile.com',
    'TW': 'https://partner.shopeemobile.com',
    'ID': 'https://partner.shopeemobile.com',
    'VN': 'https://partner.shopeemobile.com',
    'PH': 'https://partner.shopeemobile.com',
    'BR': 'https://openplatform.shopee.com.br',
    'MX': 'https://partner.shopee.com.mx',
    'CO': 'https://partner.shopee.com.co',
    'CL': 'https://partner.shopee.cl',
    'PL': 'https://partner.shopee.pl',
    'ES': 'https://partner.shopee.es',
    'FR': 'https://partner.shopee.fr'
  };

  return regionMap[region] || regionMap['SG'];
}

/**
 * Gera assinatura HMAC-SHA256 para autenticação com a API Shopee
 * @param partnerId ID do Parceiro/App na Shopee
 * @param partnerKey Chave secreta do Parceiro/App
 * @param path Caminho do endpoint da API
 * @param timestamp Timestamp UNIX em segundos
 * @param accessToken Token de acesso (opcional, apenas para endpoints autenticados)
 * @param shopId ID da loja (opcional, apenas para endpoints específicos da loja)
 * @returns Assinatura hexadecimal
 */
export function generateSignature(
  partnerId: string, 
  partnerKey: string, 
  path: string, 
  timestamp: number,
  accessToken?: string,
  shopId?: string
): string {
  // A string base varia conforme o tipo de endpoint:
  // Para autorização inicial: baseString = partnerId + apiPath + timestamp
  // Para endpoints autenticados de loja: baseString = partnerId + apiPath + timestamp + accessToken + shopId
  let baseString = `${partnerId}${path}${timestamp}`;

  // Adicionar token de acesso e ID da loja se fornecidos (para APIs autenticadas)
  if (accessToken) {
    baseString += accessToken;
  }

  if (shopId) {
    baseString += shopId;
  }

  console.log('Assinatura - String base:', baseString);

  // Gerar assinatura HMAC-SHA256 usando o partnerKey como segredo
  const hmac = createHmac('sha256', partnerKey);
  hmac.update(baseString);

  return hmac.digest('hex');
}

/**
 * Processa e padroniza erros da API Shopee
 * @param error Erro da requisição
 * @returns Erro padronizado
 */
export function parseApiError(error: any): ShopeeApiError {
  // Se já é um erro estruturado da nossa API, retornar como está
  if (error.error && error.message) {
    return error;
  }

  // Se é um erro do Axios
  if (error.response) {
    const data = error.response.data;

    // Extrair mensagem de erro da resposta da API Shopee
    if (data && data.error) {
      return {
        error: data.error,
        message: data.message || 'Shopee API error',
        requestId: data.request_id,
        response: data
      };
    }

    // Erro HTTP genérico
    return {
      error: `HTTP Error ${error.response.status}`,
      message: error.response.statusText || 'HTTP Error',
      response: error.response.data
    };
  }

  // Erro de rede ou timeout
  if (error.request) {
    return {
      error: 'NetworkError',
      message: 'Network Error: The request was made but no response was received'
    };
  }

  // Outros erros
  return {
    error: 'UnknownError',
    message: error.message || 'Unknown error occurred'
  };
}