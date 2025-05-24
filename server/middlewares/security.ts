/**
 * Middlewares de segurança para proteção da aplicação
 * Implementa validação, sanitização e proteção CSRF
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { validationResult, ValidationChain } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import Tokens from 'csrf';
import cookieParser from 'cookie-parser';

// Configuração do sanitizeHtml para permitir tags básicas
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  allowedAttributes: {},
};

// Inicializa o gerador de tokens CSRF
const tokens = new Tokens();

/**
 * Middleware para aplicar políticas de segurança HTTP com helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "replit.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "*.replit.app", "*.shopee.com", "*.shopeemobile.com"],
      connectSrc: ["'self'", "*.replit.app", "*.shopee.com", "*.shopeemobile.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * Middleware de cookie parser para uso em toda a aplicação
 */
export { cookieParser };

/**
 * Sanitiza o corpo da requisição para prevenir XSS
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions);
      }
    }
  }
  next();
};

/**
 * Middleware para validar entradas com express-validator
 * @param validations Array de validações do express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Executa todas as validações
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      message: 'Erro de validação',
      errors: errors.array(),
    });
  };
};

// Chave secreta para proteção CSRF
const SECRET_KEY = process.env.SESSION_SECRET || 'cip-shopee-csrf-secret';

/**
 * Middleware para proteção CSRF simplificada
 * Usa cookies para armazenar tokens
 */
export const csrfProtection = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Para requisições GET, gera um novo token e envia como cookie
    if (req.method === 'GET') {
      const secret = tokens.secretSync();
      const token = tokens.create(secret);
      
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,  // Precisa ser acessível pelo JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.cookie('XSRF-SECRET', secret, {
        httpOnly: true,  // Não acessível pelo JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return next();
    }
    
    // Skip para endpoints de callback da Shopee
    if (req.path.includes('/api/shopee/callback') && req.headers['user-agent']?.includes('Shopee')) {
      return next();
    }
    
    // Para outros métodos, verifica o token
    const token = (req.headers['x-xsrf-token'] || req.body._csrf || '') as string;
    const secret = req.cookies?.['XSRF-SECRET'];
    
    if (!token || !secret || !tokens.verify(secret, token)) {
      // Desabilita verificação para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Proteção CSRF desabilitada em ambiente de desenvolvimento');
        return next();
      }
      
      return res.status(403).json({ message: 'CSRF token inválido ou ausente' });
    }
    
    next();
  };
};

/**
 * Handler global de erros
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro interno:', err);
  
  // Não expor detalhes de erro em produção
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction ? 'Erro interno do servidor' : err.message;
  
  res.status(500).json({
    message: errorMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

/**
 * Middleware para proteger rotas que requerem autenticação
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ 
      message: 'Unauthorized',
      redirectTo: '/?loginRequired=true'
    });
  }
  next();
};

/**
 * Middleware para proteção contra SQL Injection
 * Detecta padrões comuns de SQL Injection em parâmetros e corpo
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  // Lista de padrões suspeitos de SQL Injection
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p/i,
    /insert|update|delete|drop|alter|truncate/i
  ];

  // Verifica query parameters
  const query = JSON.stringify(req.query);
  const body = JSON.stringify(req.body);
  const params = JSON.stringify(req.params);

  // Verifica se há padrões suspeitos nas entradas
  for (const pattern of sqlPatterns) {
    if (
      pattern.test(query) || 
      pattern.test(body) || 
      pattern.test(params)
    ) {
      return res.status(403).json({ 
        message: 'Possível tentativa de SQL Injection detectada'
      });
    }
  }

  next();
};