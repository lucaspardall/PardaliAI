/**
 * Validadores para as rotas da aplicação
 * Utiliza express-validator para validar entradas
 */

import { body, param, query } from 'express-validator';

/**
 * Validadores para rotas de produtos
 */
export const productValidators = {
  // Validação para criação de produto
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Nome do produto é obrigatório')
      .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres'),
    
    body('description')
      .trim()
      .optional()
      .isLength({ max: 2000 }).withMessage('Descrição deve ter no máximo 2000 caracteres'),
    
    body('price')
      .optional()
      .isNumeric().withMessage('Preço deve ser um número válido')
      .isFloat({ min: 0 }).withMessage('Preço deve ser maior ou igual a zero'),
    
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Categoria deve ter no máximo 50 caracteres'),
  ],
  
  // Validação para busca de produtos
  search: [
    query('query')
      .trim()
      .notEmpty().withMessage('Termo de busca é obrigatório')
      .isLength({ min: 2, max: 100 }).withMessage('Termo de busca deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-Z0-9áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\-]+$/)
      .withMessage('Termo de busca contém caracteres inválidos'),
  ],
  
  // Validação para atualização de produto
  update: [
    param('id')
      .isInt().withMessage('ID do produto deve ser um número inteiro'),
    
    body('name')
      .optional()
      .trim()
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
  
  // Validação para exclusão de produto
  delete: [
    param('id')
      .isInt().withMessage('ID do produto deve ser um número inteiro'),
  ],
};

/**
 * Validadores para rotas de autenticação
 */
export const authValidators = {
  // Validação para login
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('Nome de usuário é obrigatório')
      .isLength({ min: 3, max: 30 }).withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nome de usuário deve conter apenas letras, números e underscores'),
    
    body('password')
      .notEmpty().withMessage('Senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres'),
  ],
  
  // Validação para alteração de senha
  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Senha atual é obrigatória'),
    
    body('newPassword')
      .notEmpty().withMessage('Nova senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Nova senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Confirmação de senha é obrigatória')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Confirmação de senha não confere com a nova senha');
        }
        return true;
      }),
  ],
};

/**
 * Validadores para rotas de integração Shopee
 */
export const shopeeValidators = {
  // Validação para autenticação Shopee
  auth: [
    body('code')
      .optional()
      .isString().withMessage('Código de autorização deve ser uma string'),
    
    body('shop_id')
      .optional()
      .isInt().withMessage('ID da loja deve ser um número inteiro'),
  ],
  
  // Validação para operações de produto na Shopee
  products: [
    query('offset')
      .optional()
      .isInt({ min: 0 }).withMessage('Offset deve ser um número inteiro positivo'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limite deve ser um número inteiro entre 1 e 100'),
  ],
};