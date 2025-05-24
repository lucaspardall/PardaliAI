import path from 'path';
import fs from 'fs';

/**
 * Utilitário para registrar logs de segurança
 * Sempre sanitiza informações sensíveis antes de registrar
 */
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'authorization', 'cookie', 'access_token', 
  'refresh_token', 'sessionid', 'session_id', 'api_key', 'apikey', 'auth'
];

/**
 * Sanitiza objetos para remover dados sensíveis antes do log
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {...obj};

  for (const key in sanitized) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Logger de segurança que reduz o risco de vazamento de informações sensíveis
 */
const securityLogger = {
  /**
   * Registra informações de segurança sanitizadas
   */
  log(message, data = {}) {
    const sanitizedData = sanitizeObject(data);
    console.log(`[SECURITY] ${message}`, sanitizedData);
  },

  /**
   * Registra avisos de segurança sanitizados
   */
  warn(message, data = {}) {
    const sanitizedData = sanitizeObject(data);
    console.warn(`[SECURITY WARNING] ${message}`, sanitizedData);
  },

  /**
   * Registra erros de segurança sanitizados
   */
  error(message, data = {}) {
    const sanitizedData = sanitizeObject(data);
    console.error(`[SECURITY ERROR] ${message}`, sanitizedData);
  },

  /**
   * Registra tentativas de acesso inválidas
   */
  logAttempt(req, reason) {
    const sanitizedReq = {
      ip: req.ip,
      method: req.method,
      path: req.path,
      query: sanitizeObject(req.query),
      headers: sanitizeObject(req.headers)
    };

    this.warn(`Tentativa de acesso inválida: ${reason}`, sanitizedReq);
  }
};

export default securityLogger;