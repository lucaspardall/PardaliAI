/**
 * Middlewares de segurança centralizados
 * Implementa validação, sanitização e proteção contra vulnerabilidades comuns
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';
import { body, query, param, validationResult } from 'express-validator';

// Configuração do sanitizeHtml para permitir tags básicas
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  allowedAttributes: {},
};

/**
 * Aplica cabeçalhos de segurança usando Helmet
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
 * Middleware para proteção contra SQL Injection básica
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
      console.warn('🚨 Possível tentativa de SQL Injection detectada');
      return res.status(403).json({ 
        message: 'Operação não permitida: detectado conteúdo não autorizado'
      });
    }
  }

  next();
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
 * Validadores para produtos
 */
export const productValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Nome do produto é obrigatório')
      .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Descrição deve ter no máximo 2000 caracteres'),
    
    body('price')
      .optional()
      .isNumeric().withMessage('Preço deve ser um número válido')
      .isFloat({ min: 0 }).withMessage('Preço deve ser maior ou igual a zero'),
  ],
  
  search: [
    query('query')
      .trim()
      .notEmpty().withMessage('Termo de busca é obrigatório')
      .isLength({ min: 2, max: 100 }).withMessage('Termo de busca deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-Z0-9áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\-]+$/)
      .withMessage('Termo de busca contém caracteres inválidos'),
  ],
};

/**
 * Validadores para autenticação
 */
export const authValidators = {
  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Senha atual é obrigatória'),
    
    body('newPassword')
      .notEmpty().withMessage('Nova senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Nova senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  ],
};

/**
 * Middleware de validação que processa as regras e retorna erros
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    message: 'Erro de validação',
    errors: errors.array(),
  });
};

/**
 * Aplica os middlewares de segurança básicos a um aplicativo Express
 */
export function setupBasicSecurity(app: any) {
  // Aplica os middlewares globais
  app.use(securityHeaders);
  app.use(sanitizeRequest);
  app.use(sqlInjectionProtection);
  
  // Aplicar validadores específicos para rotas vulneráveis
  app.post('/api/products', productValidators.create, validate);
  app.get('/api/products/search', productValidators.search, validate);
  app.post('/api/auth/password', authValidators.changePassword, validate);
  
  // Handler global de erros deve ser o último middleware
  app.use(errorHandler);
  
  console.log('🔒 Segurança básica configurada com sucesso');
}