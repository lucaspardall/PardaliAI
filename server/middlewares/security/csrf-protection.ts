/**
 * Implementação de proteção CSRF para endpoints sensíveis
 * Utiliza o pacote 'csrf' para gerar e validar tokens
 */

import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

// Inicializar gerador de tokens CSRF
const tokens = new Tokens();

// Chave secreta para CSRF (idealmente vinda de variável de ambiente)
const SECRET_KEY = process.env.CSRF_SECRET || 'cip-shopee-csrf-secret-key';

/**
 * Middleware para gerar token CSRF e anexá-lo à resposta
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Gerar token CSRF
  const secret = tokens.secretSync();
  const token = tokens.create(secret);
  
  // Armazenar no cookie seguro (httpOnly)
  res.cookie('CSRF-SECRET', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  // Disponibilizar o token para o cliente via cookie não-httpOnly 
  // para que o JavaScript possa acessá-lo
  res.cookie('CSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  // Também disponibilizar o token no header
  res.header('X-CSRF-Token', token);
  
  next();
}

/**
 * Middleware para verificar token CSRF nas requisições
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip para requisições GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip para endpoints de API da Shopee (callbacks)
  if (req.path.includes('/api/shopee/callback')) {
    return next();
  }
  
  // Verificar a presença do token e do secret
  const token = req.headers['x-csrf-token'] as string || 
                req.body._csrf as string || 
                req.cookies['CSRF-TOKEN'];
  
  const secret = req.cookies['CSRF-SECRET'];
  
  // Verificar o token CSRF
  if (!token || !secret || !tokens.verify(secret, token)) {
    // Em desenvolvimento, permitir para facilitar testes
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ CSRF proteção desabilitada em desenvolvimento');
      return next();
    }
    
    return res.status(403).json({
      message: 'Acesso negado: token CSRF inválido ou ausente'
    });
  }
  
  next();
}

/**
 * Aplicar proteção CSRF às rotas sensíveis
 */
export function setupCsrfProtection(app: any) {
  // Gerar token CSRF para todas as requisições GET
  app.get('*', generateCsrfToken);
  
  // Verificar token CSRF para todas as requisições de mutação
  app.use(['/api/auth/password', '/api/products'], verifyCsrfToken);
  
  console.log('🔒 Proteção CSRF configurada');
}