/**
 * Configuração central de segurança para a aplicação
 * Aplica middlewares de segurança às rotas
 */

import { Express } from 'express';
import {
  securityHeaders,
  cookieParser,
  sanitizeRequest,
  sqlInjectionProtection,
  csrfProtection,
  errorHandler
} from './security';
import { productValidators, authValidators, shopeeValidators } from './validators';
import cookieParser from 'cookie-parser';

/**
 * Aplica configurações básicas de segurança para todas as rotas
 */
export function configureBasicSecurity(app: Express) {
  // Middlewares de segurança globais
  app.use(cookieParser());
  app.use(securityHeaders);
  app.use(sanitizeRequest);
  app.use(sqlInjectionProtection);
  
  // Proteção CSRF para todas as rotas não-GET
  app.use(csrfProtection());
  
  // Handler global de erros
  app.use(errorHandler);
  
  console.log('✅ Configurações básicas de segurança aplicadas');
}

/**
 * Aplica validadores específicos às rotas
 */
export function configureRouteValidators(app: Express) {
  // Validação para rotas de produtos
  app.post('/api/products', productValidators.create);
  app.get('/api/products/search', productValidators.search);
  app.put('/api/products/:id', productValidators.update);
  app.delete('/api/products/:id', productValidators.delete);
  
  // Validação para rotas de autenticação
  app.post('/api/auth/login', authValidators.login);
  app.post('/api/auth/password', authValidators.changePassword);
  
  // Validação para rotas da Shopee
  app.post('/api/shopee/auth', shopeeValidators.auth);
  app.get('/api/shopee/products', shopeeValidators.products);
  
  console.log('✅ Validadores de rotas configurados');
}

/**
 * Aplica todas as configurações de segurança
 */
export function configureSecurity(app: Express) {
  configureBasicSecurity(app);
  configureRouteValidators(app);
  
  console.log('🔒 Segurança configurada com sucesso');
}