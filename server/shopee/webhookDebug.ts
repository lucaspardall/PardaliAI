
/**
 * Utilitários para debug de webhooks da Shopee
 */
import { createHmac } from 'crypto';
import { Request } from 'express';

/**
 * Testa diferentes métodos de validação de assinatura
 */
export function debugWebhookSignature(req: Request, partnerKey: string): void {
  const receivedSignature = req.headers['authorization'];
  const bodyString = JSON.stringify(req.body);
  
  console.log('[Webhook Debug] Testando diferentes métodos de assinatura:');
  console.log('[Webhook Debug] Assinatura recebida:', receivedSignature);
  console.log('[Webhook Debug] Partner Key:', partnerKey?.substring(0, 10) + '...');
  
  // Método 1: Apenas o corpo (método mais comum)
  const method1 = createHmac('sha256', partnerKey)
    .update(bodyString)
    .digest('hex');
  console.log('[Webhook Debug] Método 1 (body only):', method1);
  console.log('[Webhook Debug] Método 1 match:', method1 === receivedSignature);
  
  // Método 2: URL + Body
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  const url = `${protocol}://${host}${req.originalUrl}`;
  const method2String = `${url}|${bodyString}`;
  const method2 = createHmac('sha256', partnerKey)
    .update(method2String)
    .digest('hex');
  console.log('[Webhook Debug] Método 2 (URL|body):', method2);
  console.log('[Webhook Debug] Método 2 string:', method2String);
  console.log('[Webhook Debug] Método 2 match:', method2 === receivedSignature);
  
  // Método 3: Apenas a URL
  const method3 = createHmac('sha256', partnerKey)
    .update(url)
    .digest('hex');
  console.log('[Webhook Debug] Método 3 (URL only):', method3);
  console.log('[Webhook Debug] Método 3 match:', method3 === receivedSignature);
  
  // Método 4: Body sem formatação
  const rawBody = req.rawBody || req.body;
  if (typeof rawBody === 'string') {
    const method4 = createHmac('sha256', partnerKey)
      .update(rawBody)
      .digest('hex');
    console.log('[Webhook Debug] Método 4 (raw body):', method4);
    console.log('[Webhook Debug] Método 4 match:', method4 === receivedSignature);
  }
  
  // Método 5: Path + timestamp + body (usado em algumas APIs)
  const timestamp = req.body.timestamp;
  if (timestamp) {
    const method5String = `${req.originalUrl}${timestamp}${bodyString}`;
    const method5 = createHmac('sha256', partnerKey)
      .update(method5String)
      .digest('hex');
    console.log('[Webhook Debug] Método 5 (path+timestamp+body):', method5);
    console.log('[Webhook Debug] Método 5 match:', method5 === receivedSignature);
  }
  
  console.log('[Webhook Debug] ================================');
}

/**
 * Salva dados do webhook para análise posterior
 */
export function saveWebhookForAnalysis(req: Request): void {
  const webhookData = {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  };
  
  // Salvar em arquivo para análise (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    const fs = require('fs');
    const filename = `webhook_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(webhookData, null, 2));
    console.log(`[Webhook Debug] Dados salvos em: ${filename}`);
  }
}
