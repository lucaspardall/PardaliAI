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
  const timestamp = Math.floor(Date.now() / 1000);

  // Estado para proteção CSRF
  const stateParam = `cipshopee_${Date.now()}`;

  // URL base para o fluxo de autorização de loja
  const baseUrl = 'https://partner.shopeemobile.com';
  const apiPath = '/api/v2/shop/auth_partner';

  // String base para gerar assinatura - Formato: partner_id + api_path + timestamp
  const baseString = `${config.partnerId}${apiPath}${timestamp}`;

  console.log(`String base para assinatura (método minimalista): ${baseString}`);

  // Gerar assinatura HMAC-SHA256
  const hmac = createHmac('sha256', config.partnerKey);
  hmac.update(baseString);
  const signature = hmac.digest('hex');

  console.log(`Assinatura gerada (método minimalista): ${signature}`);

  // Construir URL usando URLSearchParams para garantir codificação correta
  const url = new URL(`${baseUrl}${apiPath}`);
  const params = new URLSearchParams();

  // Adicionar parâmetros na ordem recomendada pela documentação
  params.append('partner_id', config.partnerId.toString());
  params.append('timestamp', timestamp.toString());
  params.append('sign', signature);
  params.append('redirect', config.redirectUrl);
  params.append('state', stateParam);

  // Garantir que a URL não tenha caracteres problemáticos
  url.search = params.toString();

  console.log(`URL minimalista gerada: ${url.toString()}`);

  return url.toString();
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