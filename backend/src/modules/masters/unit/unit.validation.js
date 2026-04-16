const Joi = require('joi');


const unitSchema = Joi.object({
  unitCode: Joi.string().required(),
  unitName: Joi.string().required(),
  symbol: Joi.string().optional().allow('', null),
  decimalPlaces: Joi.number().integer().min(0).max(6).default(0),
  isActive: Joi.boolean().default(true)
});

module.exports = { unitSchema };
