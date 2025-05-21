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
 * @param isAuthUrl Se verdadeiro, retorna a URL para interface de vendedores (não usado)
 * IMPORTANTE: Para todas as operações, incluindo autenticação OAuth, 
 * SEMPRE use partner.shopeemobile.com conforme documentação oficial
 * @returns URL base da API
 */
export function getApiBaseUrl(region: ShopeeRegion, isAuthUrl: boolean = false): string {
  // URLs específicas para cada região
  const regionUrls: Record<ShopeeRegion, string> = {
    BR: 'https://open.shopee.com.br', // Brasil usa domínio específico
    // Outras regiões usam o domínio padrão
    SG: 'https://partner.shopeemobile.com',
    MY: 'https://partner.shopeemobile.com',
    TH: 'https://partner.shopeemobile.com',
    TW: 'https://partner.shopeemobile.com',
    ID: 'https://partner.shopeemobile.com',
    VN: 'https://partner.shopeemobile.com',
    PH: 'https://partner.shopeemobile.com',
    MX: 'https://partner.shopeemobile.com',
    CO: 'https://partner.shopeemobile.com',
    CL: 'https://partner.shopeemobile.com',
    PL: 'https://partner.shopeemobile.com',
    ES: 'https://partner.shopeemobile.com',
    FR: 'https://partner.shopeemobile.com'
  };

  console.log(`Obtendo URL base para região: ${region}`);

  // Se existir uma URL específica para a região, use-a
  if (region in regionUrls) {
    console.log(`URL específica encontrada para ${region}: ${regionUrls[region]}`);
    return regionUrls[region];
  }

  // Fallback para o domínio padrão
  console.log('Usando URL padrão: https://partner.shopeemobile.com');
  return 'https://partner.shopeemobile.com';
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
    console.log('Detalhes do erro da resposta:', JSON.stringify(data, null, 2));

    // Verificar estrutura específica de erro de token não encontrado
    if (data && data.errcode === 2) {
      return {
        error: 'TokenNotFound',
        message: data.message || 'Token não encontrado ou inválido',
        response: data
      };
    }

    // Extrair mensagem de erro da resposta da API Shopee
    if (data && (data.error || data.errcode || data.error_type)) {
      return {
        error: data.error || `ErrorCode_${data.errcode}` || data.error_type,
        message: data.message || data.error_msg || data.error_description || 'Erro na API da Shopee',
        requestId: data.request_id,
        response: data
      };
    }

    // Erro HTTP genérico
    return {
      error: `HTTP_${error.response.status}`,
      message: error.response.statusText || `Erro HTTP ${error.response.status}`,
      response: error.response.data
    };
  }

  // Erro de rede ou timeout
  if (error.request) {
    return {
      error: 'NetworkError',
      message: 'Erro de rede: A requisição foi feita mas não houve resposta',
      details: error.message
    };
  }

  // Erros de timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      error: 'TimeoutError',
      message: 'A requisição excedeu o tempo limite',
      details: error.message
    };
  }

  // Outros erros
  return {
    error: 'UnknownError',
    message: error.message || 'Ocorreu um erro desconhecido',
    details: JSON.stringify(error)
  };
}