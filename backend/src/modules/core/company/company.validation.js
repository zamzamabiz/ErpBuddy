const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().required(),
  legalName: Joi.string().allow(''),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(''),
  country: Joi.string().allow(''),
  currency: Joi.string().allow(''),
  timezone: Joi.string().allow(''),
  address: Joi.string().allow(''),
  taxNumber: Joi.string().allow(''),
  logo: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active')
});

exports.update = Joi.object({
  name: Joi.string(),
  legalName: Joi.string().allow(''),
  email: Joi.string().email(),
  phone: Joi.string().allow(''),
  country: Joi.string().allow(''),
  currency: Joi.string().allow(''),
  timezone: Joi.string().allow(''),
  address: Joi.string().allow(''),
  taxNumber: Joi.string().allow(''),
  logo: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive')
});
