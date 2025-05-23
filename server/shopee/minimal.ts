
/**
 * Implementação minimalista para autenticação Shopee
 * Esta versão usa apenas os parâmetros obrigatórios, sem parâmetros extras
 */
import { createHmac } from 'crypto';
import { ShopeeAuthConfig } from './types';

/**
 * Gera URL de autorização minimalista com apenas os parâmetros essenciais
 * Os únicos parâmetros usados são: partner_id, timestamp, sign, redirect, state
 */
export function generateMinimalAuthUrl(config: ShopeeAuthConfig): string {
  // Gerar timestamp em segundos
  const timestamp = Math.floor(Date.now() / 1000);

  // Estado para proteção CSRF
  const stateParam = `cipshopee_${Date.now()}`;

  // URL base para o fluxo de autorização de loja
  const baseUrl = 'https://partner.shopeemobile.com';
  const apiPath = '/api/v2/shop/auth_partner';

  // String base para gerar assinatura - Formato exato: partner_id + api_path + timestamp
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;

  console.log(`[Minimal Auth] String base para assinatura: ${baseString}`);

  // Gerar assinatura HMAC-SHA256
  const hmac = createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');

  console.log(`[Minimal Auth] Assinatura gerada: ${signature}`);

  // Montar URL com apenas os parâmetros essenciais, na ordem documentada
  const url = new URL(`${baseUrl}${apiPath}`);
  const params = new URLSearchParams();

  // Adicionar apenas os parâmetros essenciais, conforme documentação oficial
  params.append('partner_id', config.partnerId.toString());
  params.append('timestamp', timestamp.toString());
  params.append('sign', signature);
  params.append('redirect', config.redirectUrl);
  params.append('state', stateParam);

  url.search = params.toString();
  const finalUrl = url.toString();

  console.log(`[Minimal Auth] URL final: ${finalUrl}`);
  
  // Registrar no console para fácil verificação dos parâmetros
  console.log('[Minimal Auth] Verificação rápida dos parâmetros:');
  console.log(`- partner_id presente: ${finalUrl.includes('partner_id=')})`);
  console.log(`- timestamp presente: ${finalUrl.includes('timestamp=')})`);
  console.log(`- sign presente: ${finalUrl.includes('sign=')})`);
  console.log(`- redirect presente: ${finalUrl.includes('redirect=')})`);
  console.log(`- state presente: ${finalUrl.includes('state=')})`);

  return finalUrl;
}

/**
 * Gera variantes da URL para testes, adicionando um parâmetro por vez
 * Útil para identificar qual parâmetro específico causa problema
 */
export function generateTestVariants(config: ShopeeAuthConfig): Record<string, string> {
  // URL com apenas os parâmetros obrigatórios
  const minimalUrl = generateMinimalAuthUrl(config);
  
  return {
    // URL base apenas com parâmetros essenciais
    minimal: minimalUrl,
    
    // Adicionando um parâmetro por vez
    withRegion: `${minimalUrl}&region=${config.region}`,
    withAuthShop: `${minimalUrl}&is_auth_shop=true`,
    withLoginType: `${minimalUrl}&login_type=seller`,
    withAuthType: `${minimalUrl}&auth_type=direct`,
    
    // Combinações de dois parâmetros
    withRegionAndAuthShop: `${minimalUrl}&region=${config.region}&is_auth_shop=true`,
    withLoginAndAuthType: `${minimalUrl}&login_type=seller&auth_type=direct`,
    
    // URL com todos os parâmetros opcionais
    complete: `${minimalUrl}&region=${config.region}&is_auth_shop=true&login_type=seller&auth_type=direct`,
    
    // Variante específica para Brasil
    brOnly: `${minimalUrl}&region=BR`,
  };
}
