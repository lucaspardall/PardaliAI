
/**
 * Implementação minimalista para autenticação Shopee
 * Esta versão usa apenas os parâmetros obrigatórios, sem parâmetros extras
 */
import { createHmac } from 'crypto';
import { ShopeeAuthConfig } from './types';
import { getTimestamp } from './utils';

/**
 * Gera URL de autorização minimalista com apenas os parâmetros essenciais
 * Os únicos parâmetros usados são: partner_id, timestamp, sign, redirect, state
 */
export function generateMinimalAuthUrl(config: ShopeeAuthConfig): string {
  // Gerar timestamp em segundos
  const timestamp = getTimestamp();

  // Criar o estado único para CSRF protection
  const stateParam = `cipshopee_${Date.now()}`;

  // Verificar se a URL de redirecionamento está definida
  if (!config.redirectUrl) {
    throw new Error('URL de redirecionamento não definida na configuração');
  }

  // URL BASE para o fluxo de autorização de loja
  const baseUrl = 'https://partner.shopeemobile.com';
  const apiPath = '/api/v2/shop/auth_partner';
  
  // String base para gerar assinatura (seguindo documentação oficial)
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;
  console.log(`String base para assinatura (minimalista): ${baseString}`);

  // Gerar assinatura HMAC-SHA256
  const hmac = createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');
  console.log(`Assinatura gerada: ${signature}`);

  // Construir URL de autorização apenas com parâmetros obrigatórios
  // Esta é a versão minimalista sem nenhum parâmetro extra
  const minimalAuthUrl = `${baseUrl}${apiPath}?` +
    `partner_id=${config.partnerId}&` +
    `timestamp=${timestamp}&` +
    `sign=${signature}&` +
    `redirect=${encodeURIComponent(config.redirectUrl)}&` +
    `state=${stateParam}`;

  console.log(`✅ URL minimalista gerada: ${minimalAuthUrl}`);
  
  return minimalAuthUrl;
}

/**
 * Gera várias variantes de URLs minimalistas para testes
 * Cada versão adiciona um único parâmetro para isolar qual parâmetro causa problemas
 */
export function generateTestVariants(config: ShopeeAuthConfig): Record<string, string> {
  // Gerar URL base minimalista
  const minimalUrl = generateMinimalAuthUrl(config);
  
  // Adicionar parâmetros um a um para testar
  return {
    minimal: minimalUrl,
    withRegion: `${minimalUrl}&region=${config.region}`,
    withAuthShop: `${minimalUrl}&is_auth_shop=true`,
    withLoginType: `${minimalUrl}&login_type=seller`,
    withAuthType: `${minimalUrl}&auth_type=direct`,
    // Adicionar dois parâmetros juntos
    withRegionAndAuthShop: `${minimalUrl}&region=${config.region}&is_auth_shop=true`,
    withLoginAndAuthType: `${minimalUrl}&login_type=seller&auth_type=direct`,
  };
}
