
const fs = require('fs');
const path = require('path');

class SecurityLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(event, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      details: this.sanitizeDetails(details),
      environment: process.env.NODE_ENV || 'development'
    };

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SECURITY]', event, details);
    }

    // Escrever no arquivo
    const logFile = path.join(this.logDir, `security-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  // Remove dados sensíveis dos logs
  sanitizeDetails(details) {
    const sanitized = { ...details };
    
    // Remover senhas, tokens, etc
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Limpar headers sensíveis
    if (sanitized.headers) {
      const safeHeaders = { ...sanitized.headers };
      if (safeHeaders.authorization) safeHeaders.authorization = '[REDACTED]';
      if (safeHeaders.cookie) safeHeaders.cookie = '[REDACTED]';
      sanitized.headers = safeHeaders;
    }

    return sanitized;
  }

  // Logs específicos
  logFailedLogin(email, ip) {
    this.log('FAILED_LOGIN', { email, ip, timestamp: Date.now() });
  }

  logSuspiciousActivity(userId, activity, ip) {
    this.log('SUSPICIOUS_ACTIVITY', { userId, activity, ip });
  }

  logUnauthorizedAccess(path, userId, ip) {
    this.log('UNAUTHORIZED_ACCESS', { path, userId, ip });
  }

  logRateLimitExceeded(ip, endpoint) {
    this.log('RATE_LIMIT_EXCEEDED', { ip, endpoint });
  }
}

module.exports = new SecurityLogger();
/**
 * Utilitário para log de eventos de segurança
 * Garante que informações sensíveis não sejam logadas em produção
 */

const { log } = require('../vite');

/**
 * Loga eventos de segurança de forma segura
 * @param {string} event - O evento de segurança
 * @param {Object} data - Dados relacionados ao evento
 * @param {boolean} isSensitive - Se os dados contêm informações sensíveis
 */
function securityLog(event, data = {}, isSensitive = false) {
  // Verifica se está em produção
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Em produção, não registra dados sensíveis
  if (isProduction && isSensitive) {
    log(`[SECURITY] ${event} - Dados sensíveis omitidos`, 'security');
    return;
  }
  
  // Em desenvolvimento ou para dados não sensíveis
  try {
    const sanitizedData = isProduction 
      ? sanitizeData(data)
      : data;
      
    log(`[SECURITY] ${event} - ${JSON.stringify(sanitizedData)}`, 'security');
  } catch (error) {
    log(`[SECURITY] ${event} - Erro ao registrar log: ${error.message}`, 'security');
  }
}

/**
 * Sanitiza dados para remover informações sensíveis
 * @param {Object} data - Dados a serem sanitizados
 * @returns {Object} Dados sanitizados
 */
function sanitizeData(data) {
  const sensitiveFields = [
    'password', 'senha', 'token', 'secret', 'api_key', 'apiKey', 
    'access_token', 'accessToken', 'refresh_token', 'refreshToken',
    'authorization', 'sessionId', 'session_id', 'cookie'
  ];
  
  // Clone o objeto para não modificar o original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Função recursiva para sanitizar objetos aninhados
  function sanitizeRecursive(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      // Verifica se é um campo sensível
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } 
      // Verifica recursivamente objetos aninhados
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeRecursive(obj[key]);
      }
    });
  }
  
  sanitizeRecursive(sanitized);
  return sanitized;
}

module.exports = {
  securityLog,
  sanitizeData
};
