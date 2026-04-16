const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().required(),
  displayName: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  mobile: Joi.string().allow(''),
  address: Joi.string().allow(''),
  city: Joi.string().allow(''),
  country: Joi.string().allow(''),
  taxNumber: Joi.string().allow(''),
  paymentTerms: Joi.string().allow(''),
  currency: Joi.string().allow(''),
  bankName: Joi.string().allow(''),
  bankAccount: Joi.string().allow(''),
  creditLimit: Joi.number().min(0),
  status: Joi.string().valid('active', 'inactive'),
  notes: Joi.string().allow(''),
});

exports.update = Joi.object({
  name: Joi.string(),
  displayName: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  mobile: Joi.string().allow(''),
  address: Joi.string().allow(''),
  city: Joi.string().allow(''),
  country: Joi.string().allow(''),
  taxNumber: Joi.string().allow(''),
  paymentTerms: Joi.string().allow(''),
  currency: Joi.string().allow(''),
  bankName: Joi.string().allow(''),
  bankAccount: Joi.string().allow(''),
  creditLimit: Joi.number().min(0),
  status: Joi.string().valid('active', 'inactive'),
  notes: Joi.string().allow(''),
});
