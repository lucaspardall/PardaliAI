module.exports = {
  security: {
    forceHttps: true,
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    },
    cookieOptions: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    },
    cors: {
      allowedOrigins: [
        'https://*.replit.app',
        'https://*.repl.co',
        'https://*.preview.app.github.dev'
      ]
    }
  },
  rateLimits: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 300 // limite de requests
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10 // tentativas de login
    }
  },
  logging: {
    level: 'error',
    sanitize: true
  }
};