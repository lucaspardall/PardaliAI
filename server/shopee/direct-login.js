
/**
 * Utilitário para forçar o uso da API partner.shopeemobile.com e evitar redirecionamentos
 * para a Open Platform ou outras páginas de login da Shopee.
 */

/**
 * Força o uso da API de parceiros em vez de redirecionamentos para a Open Platform
 * @param {string} partnerId - ID do parceiro Shopee
 * @param {string} sign - Assinatura gerada para autenticação
 * @param {string} timestamp - Timestamp usado na assinatura
 * @param {string} redirectUrl - URL de redirecionamento após autorização
 * @returns {string} URL direta para API de parceiros
 */
export function getDirectPartnerUrl(partnerId, sign, timestamp, redirectUrl) {
  // SEMPRE usar domínio partner.shopeemobile.com que é a API oficial de parceiros
  const directUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?` + 
    `partner_id=${partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${sign}&` +
    `redirect=${encodeURIComponent(redirectUrl)}&` +
    `region=BR&` +
    `is_auth_shop=true&` +
    `login_type=seller&` +
    `auth_type=direct`;
    
  return directUrl;
}

/**
 * Verifica se uma URL contém redirecionamentos indesejados para páginas fora da API de parceiros
 * @param {string} url - URL a ser verificada
 * @returns {boolean} true se a URL contém redirecionamentos indesejados
 */
export function hasUnwantedRedirect(url) {
  return url.includes('open.shopee') || 
         url.includes('account.seller.shopee') || 
         url.includes('accounts.shopee') ||
         url.includes('business.accounts.shopee') ||
         !url.includes('partner.shopeemobile.com');
}

/**
 * Valida e corrige uma URL para garantir que está usando a API de parceiros
 * @param {string} url - URL original
 * @param {object} params - Parâmetros necessários (partnerId, sign, timestamp, redirectUrl)
 * @returns {string} URL corrigida
 */
export function validateAndFixUrl(url, { partnerId, sign, timestamp, redirectUrl }) {
  if (hasUnwantedRedirect(url)) {
    console.warn('URL inválida detectada, forçando uso da API de parceiros');
    return getDirectPartnerUrl(partnerId, sign, timestamp, redirectUrl);
  }
  
  return url;
}
