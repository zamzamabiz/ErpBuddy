const Joi = require('joi');

/**
 * Validate create account request
 */
function validateCreateAccount(body) {
  const schema = Joi.object({
    code: Joi.string()
      .required()
      .max(20)
      .messages({
        'any.required': 'Account code is required',
        'string.empty': 'Account code cannot be empty'
      }),
    name: Joi.string()
      .required()
      .max(100)
      .messages({
        'any.required': 'Account name is required',
        'string.empty': 'Account name cannot be empty'
      }),
    type: Joi.string()
      .required()
      .valid('asset', 'liability', 'equity', 'income', 'expense')
      .messages({
        'any.required': 'Account type is required',
        'any.only': 'Account type must be one of: asset, liability, equity, income, expense'
      }),
    parentId: Joi.string()
      .optional()
      .allow(null)
      .messages({
        'string.base': 'Parent ID must be a valid ID'
      }),
    description: Joi.string().optional().allow('').max(500)
  });

  return schema.validate(body, { abortEarly: false });
}

/**
 * Validate update account request
 */
function validateUpdateAccount(body) {
  const schema = Joi.object({
    name: Joi.string()
      .optional()
      .max(100)
      .messages({
        'string.empty': 'Account name cannot be empty'
      }),
    parentId: Joi.string()
      .optional()
      .allow(null)
      .messages({
        'string.base': 'Parent ID must be a valid ID'
      }),
    description: Joi.string().optional().allow('').max(500)
  });

  return schema.validate(body, { abortEarly: false });
}

module.exports = {
  validateCreateAccount,
  validateUpdateAccount
};
