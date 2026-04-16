const Joi = require('joi');

const warehouseValidation = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().allow(''),
  address: Joi.string().allow(''),
  city: Joi.string().allow(''),
  country: Joi.string().allow(''),
  manager: Joi.string().optional().allow(null, ''),
  phone: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  notes: Joi.string().allow(''),
});

module.exports = { warehouseValidation };
