
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
 * @param isAuthUrl Se verdadeiro, retorna a URL para interface de vendedores
 * IMPORTANTE: Para endpoints de autenticação OAuth como /api/v2/shop/auth_partner, 
 * SEMPRE use partner.shopeemobile.com, não as URLs de seller
 * @returns URL base da API
 */
export function getApiBaseUrl(region: ShopeeRegion, isAuthUrl: boolean = false): string {
  // URLs de autenticação específicas para cada região (para interface de vendedor)
  const authRegionMap: Record<ShopeeRegion, string> = {
    'SG': 'https://seller.shopee.sg',
    'MY': 'https://seller.shopee.com.my',
    'TH': 'https://seller.shopee.co.th',
    'TW': 'https://seller.shopee.tw',
    'ID': 'https://seller.shopee.co.id',
    'VN': 'https://seller.shopee.vn',
    'PH': 'https://seller.shopee.ph',
    'BR': 'https://seller.shopee.com.br',
    'MX': 'https://seller.shopee.com.mx',
    'CO': 'https://seller.shopee.com.co',
    'CL': 'https://seller.shopee.cl',
    'PL': 'https://seller.shopee.pl',
    'ES': 'https://seller.shopee.es',
    'FR': 'https://seller.shopee.fr'
  };

  // URLs da API para cada região
  const apiRegionMap: Record<ShopeeRegion, string> = {
    'SG': 'https://partner.shopeemobile.com',
    'MY': 'https://partner.shopeemobile.com',
    'TH': 'https://partner.shopeemobile.com',
    'TW': 'https://partner.shopeemobile.com',
    'ID': 'https://partner.shopeemobile.com',
    'VN': 'https://partner.shopeemobile.com',
    'PH': 'https://partner.shopeemobile.com',
    'BR': 'https://partner.shopeemobile.com', // Domínio global para APIs da Shopee (mesmo para o Brasil)
    'MX': 'https://partner.shopeemobile.com',
    'CO': 'https://partner.shopeemobile.com',
    'CL': 'https://partner.shopeemobile.com',
    'PL': 'https://partner.shopeemobile.com', 
    'ES': 'https://partner.shopeemobile.com',
    'FR': 'https://partner.shopeemobile.com'
  };

  // Retornar a URL apropriada com base no tipo de URL e região
  return isAuthUrl 
    ? authRegionMap[region] || authRegionMap['BR'] 
    : apiRegionMap[region] || apiRegionMap['BR'];
}

/**
 * Gera assinatura HMAC-SHA256 para autenticação com a API Shopee
 * @param partnerId ID do Parceiro/App na Shopee
 * @param partnerKey Chave secreta do Parceiro/App
 * @param path Caminho do endpoint da API ou string base completa
 * @param timestamp Timestamp UNIX em segundos
 * @param accessToken Token de acesso (opcional, apenas para endpoints autenticados)
 * @param shopId ID da loja (opcional, apenas para endpoints específicos da loja)
 * @param requestBody Corpo da requisição para métodos POST/PUT (opcional)
 * @param useBaseStringDirectly Se true, usa a string fornecida diretamente
 * @returns Assinatura hexadecimal
 */
export function generateSignature(
  partnerId: string, 
  partnerKey: string, 
  path: string, 
  timestamp: number,
  accessToken?: { access_token: string },
  shopId?: { shop_id: string },
  requestBody?: any,
  useBaseStringDirectly: boolean = false
): string {
  let baseString = '';
  
  if (useBaseStringDirectly) {
    // Usar a string base fornecida diretamente (útil para endpoints que precisam de formato específico)
    baseString = path;
  } else if (path === '/api/v2/shop/auth_partner') {
    // Caso especial para autorização OAuth
    // Formato: partnerId + endpoint + timestamp
    baseString = `${partnerId}${path}${timestamp}`;
  } else if (requestBody) {
    // Endpoints POST/PUT com corpo JSON 
    // Formato: partnerId + path + timestamp + access_token + shop_id + corpo_json_minificado
    const minifiedBody = JSON.stringify(requestBody);
    
    let components = [partnerId, path, timestamp.toString()];
    
    // Adicionar access_token se disponível
    if (accessToken) {
      components.push(accessToken.access_token);
    }
    
    // Adicionar shop_id se disponível
    if (shopId) {
      components.push(shopId.shop_id);
    }
    
    // Adicionar corpo minificado
    components.push(minifiedBody);
    
    // Concatenar componentes para formar a string base
    baseString = components.join('');
  } else {
    // Endpoints GET autenticados
    // Formato: partnerId + path + timestamp + access_token + shop_id
    let components = [partnerId, path, timestamp.toString()];
    
    // Adicionar access_token se disponível
    if (accessToken) {
      components.push(accessToken.access_token);
    }
    
    // Adicionar shop_id se disponível
    if (shopId) {
      components.push(shopId.shop_id);
    }
    
    // Concatenar componentes para formar a string base
    baseString = components.join('');
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
