const Joi = require('joi');

const taxSchema = Joi.object({
  taxCode: Joi.string().required(),
  taxName: Joi.string().required(),
  taxType: Joi.string().valid('Sales', 'Purchase', 'Withholding', 'Import', 'Export').required(),
  taxRate: Joi.number().required(),
  taxAccount: Joi.string().optional().allow('', null),
  isCompoundTax: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true)
});

module.exports = { taxSchema };
