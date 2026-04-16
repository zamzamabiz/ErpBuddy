const Joi = require('joi');

/**
 * Validate generate document number request
 * @param {Object} body - Request body
 * @returns {Object} { error, value }
 */
function validateGenerateRequest(body) {
  const schema = Joi.object({
    module: Joi.string()
      .required()
      .trim()
      .lowercase()
      .valid('sales', 'purchase', 'journal', 'payment', 'receipt', 'inventory', 'payroll')
      .messages({
        'any.required': 'Module is required',
        'string.empty': 'Module cannot be empty',
        'any.only': 'Module must be one of: sales, purchase, journal, payment, receipt, inventory, payroll'
      })
  });

  return schema.validate(body, { abortEarly: false });
}

module.exports = {
  validateGenerateRequest
};
