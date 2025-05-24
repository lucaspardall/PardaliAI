
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
