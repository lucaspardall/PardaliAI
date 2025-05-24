
// Configurações específicas de produção
export default {
  // Segurança
  security: {
    // Forçar HTTPS
    forceHttps: true,
    
    // Cookies seguros
    cookieOptions: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    },
    
    // Headers adicionais
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  
  // Logs
  logging: {
    level: 'error', // Apenas erros em produção
    sanitize: true
  },
  
  // Rate limits mais restritivos
  rateLimits: {
    global: { windowMs: 15 * 60 * 1000, max: 50 },
    auth: { windowMs: 15 * 60 * 1000, max: 3 },
    api: { windowMs: 1 * 60 * 1000, max: 20 }
  }
};
