
// Configurações de produção
const productionConfig = {
  // Configurações de segurança para produção
  security: {
    // Configurações adicionais para CORS
    cors: {
      allowedOrigins: [
        'https://cipshopee.com',
        'https://*.repl.co',
        'https://*.replit.app',
        'https://*.replit.dev',
        '*' // Temporariamente permitir todas as origens para debug
      ]
    },
    // Opções para cookies em produção
    cookieOptions: {
      secure: true,
      httpOnly: true,
      sameSite: 'none'
    },
    // Headers de segurança adicionais
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    // Forçar redirecionamento para HTTPS
    forceHttps: false
  },
  // Configurações de limites de requisições
  rateLimits: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 200 // Aumentado para produção
    },
    auth: {
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 10 // Tentativas de login
    }
  },
  // Configurações de logging para produção
  logging: {
    level: 'error', // Log apenas erros
    sanitize: false // Temporariamente permitir logs para debug
  }
};

export default productionConfig;
