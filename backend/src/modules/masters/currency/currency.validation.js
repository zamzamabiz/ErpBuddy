const Joi = require('joi');

const currencySchema = Joi.object({
  currencyCode: Joi.string().required(),
  currencyName: Joi.string().required(),
  symbol: Joi.string().optional().allow('', null),
  exchangeRate: Joi.number().default(1),
  isBaseCurrency: Joi.boolean().default(false),
  decimalPlaces: Joi.number().integer().min(0).max(6).default(2),
  isActive: Joi.boolean().default(true)
});

module.exports = { currencySchema };
