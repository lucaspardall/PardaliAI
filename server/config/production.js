
// Configurações específicas para o ambiente de produção
export default {
  // Configurações de segurança
  security: {
    // Forçar HTTPS em produção
    forceHttps: false,
    
    // Configurações de CORS
    cors: {
      // Origens permitidas
      allowedOrigins: ['*'],
    },
    
    // Headers de segurança adicionais
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
    
    // Opções de cookie seguro
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    }
  },
  
  // Limites de taxa de requisições
  rateLimits: {
    // Limite global
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 500, // Aumentado para 500 requisições
    },
    
    // Limite para endpoints de autenticação
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 20, // Aumentado para 20 tentativas
    }
  },
  
  // Configurações de log
  logging: {
    level: 'info', // 'error', 'info', 'debug'
    sanitize: false // Não sanitizar logs para facilitar depuração
  }
};
