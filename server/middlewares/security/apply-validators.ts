/**
 * Configuração para aplicar validadores às rotas existentes
 * Integra os validadores com o Express sem modificar a lógica de negócios
 */

import { Express } from 'express';
import { productValidators, authValidators, validateRequest } from './route-validators';

/**
 * Aplica validadores a rotas específicas identificadas como vulneráveis
 * pelo scanner de segurança
 */
export function applyValidatorsToRoutes(app: Express): void {
  // Validação para rotas de produtos
  app.use('/api/products/search', productValidators.search, validateRequest);
  app.post('/api/products', productValidators.create, validateRequest);

  // Validação para rotas de autenticação
  app.post('/api/auth/password', authValidators.passwordChange, validateRequest);

  console.log('✅ Validadores de segurança aplicados às rotas vulneráveis');
}

/**
 * Função para inicializar todas as proteções de segurança relacionadas
 * a validação de entrada nas rotas
 */
export function setupRouteValidators(app: Express): void {
  applyValidatorsToRoutes(app);
}