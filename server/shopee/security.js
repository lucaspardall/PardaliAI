import crypto from 'crypto';

/**
 * Validador de segurança para requisições da Shopee
 * Verifica assinaturas e parâmetros para proteger contra ataques
 */
function validateShopeeRequest(req, partnerId, partnerKey) {
  const { sign, timestamp } = req.query;

  if (!sign || !timestamp) {
    return {
      valid: false,
      reason: 'Parâmetros de segurança ausentes'
    };
  }

  // Verificar se o timestamp está dentro de um período válido (15 minutos)
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);

  if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > 900) {
    return {
      valid: false,
      reason: 'Timestamp inválido ou expirado'
    };
  }

  // Verificar assinatura
  const path = req.path;
  const baseString = `${partnerId}${path}${timestamp}`;

  const hmac = crypto.createHmac('sha256', partnerKey);
  hmac.update(baseString);
  const expectedSign = hmac.digest('hex');

  if (sign !== expectedSign) {
    return {
      valid: false,
      reason: 'Assinatura inválida'
    };
  }

  return {
    valid: true
  };
}

export default validateShopeeRequest;