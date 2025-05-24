
// Funções de validação para requisições HTTP

// Validador de entrada para valores
export const validateInput = {
  string: (value) => typeof value === 'string',
  number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  boolean: (value) => typeof value === 'boolean',
  array: (value) => Array.isArray(value),
  object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
  date: (value) => value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value))),
  email: (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && re.test(value);
  }
};

// Middleware de validação de requisições
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validar cada campo definido no schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Verificar se o campo é obrigatório
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`O campo '${field}' é obrigatório`);
        continue;
      }

      // Se o campo não está presente e não é obrigatório, pular validação
      if ((value === undefined || value === null || value === '') && !rules.required) {
        continue;
      }

      // Validar tipo do campo
      if (rules.type) {
        const typeValidator = validateInput[rules.type];
        if (typeValidator && !typeValidator(value)) {
          errors.push(`O campo '${field}' deve ser do tipo '${rules.type}'`);
        }
      }

      // Validar comprimento máximo para strings
      if (rules.type === 'string' && rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`O campo '${field}' deve ter no máximo ${rules.maxLength} caracteres`);
      }

      // Validar comprimento mínimo para strings
      if (rules.type === 'string' && rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`O campo '${field}' deve ter no mínimo ${rules.minLength} caracteres`);
      }

      // Validar valor mínimo para números
      if (rules.type === 'number' && rules.min !== undefined && value < rules.min) {
        errors.push(`O campo '${field}' deve ser maior ou igual a ${rules.min}`);
      }

      // Validar valor máximo para números
      if (rules.type === 'number' && rules.max !== undefined && value > rules.max) {
        errors.push(`O campo '${field}' deve ser menor ou igual a ${rules.max}`);
      }

      // Validar enumerações (valores permitidos)
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`O campo '${field}' deve ser um dos seguintes valores: ${rules.enum.join(', ')}`);
      }

      // Validar padrão regex
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push(`O campo '${field}' não atende ao padrão requerido`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

// Exportar middleware de validação
export default { validateRequest, validateInput };
