/**
 * Validadores específicos para rotas vulneráveis
 * Implementa regras de validação para proteger contra entradas maliciosas
 */

import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';

/**
 * Validadores para rotas de produtos
 */
export const productValidators = {
  // Validadores para criar produto
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Nome do produto é obrigatório')
      .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres')
      .escape(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Descrição deve ter no máximo 2000 caracteres')
      .escape(),
    
    body('price')
      .optional()
      .isNumeric().withMessage('Preço deve ser um número válido')
      .isFloat({ min: 0 }).withMessage('Preço deve ser maior ou igual a zero'),
    
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Categoria deve ter no máximo 50 caracteres')
      .escape(),
  ],
  
  // Validadores para busca de produtos
  search: [
    query('query')
      .trim()
      .notEmpty().withMessage('Termo de busca é obrigatório')
      .isLength({ min: 2, max: 100 }).withMessage('Termo de busca deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-Z0-9áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\-]+$/)
      .withMessage('Termo de busca contém caracteres inválidos')
      .escape(),
  ],
};

/**
 * Validadores para rotas de autenticação
 */
export const authValidators = {
  // Validadores para alteração de senha
  passwordChange: [
    body('currentPassword')
      .notEmpty().withMessage('Senha atual é obrigatória'),
    
    body('newPassword')
      .notEmpty().withMessage('Nova senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Nova senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Confirmação de senha não confere com a nova senha');
        }
        return true;
      }),
  ],
};

/**
 * Middleware para processar validações e retornar erros
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    message: 'Erro de validação',
    errors: errors.array(),
  });
}