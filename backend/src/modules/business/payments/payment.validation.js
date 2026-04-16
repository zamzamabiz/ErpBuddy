const Joi = require('joi');

const create = Joi.object({
  company: Joi.string().required(),
  paymentNumber: Joi.string().required(),
  paymentDate: Joi.date().required(),
  paymentType: Joi.string().valid('Payment', 'Receipt').required(),
  partyType: Joi.string().valid('Customer', 'Supplier').required(),
  party: Joi.string().required(),
  paymentMethod: Joi.string().valid('Cash', 'Bank').required(),
  account: Joi.string().required(),
  currency: Joi.string().required(),
  exchangeRate: Joi.number().min(0).default(1),
  amount: Joi.number().min(0).required(),
  referenceNumber: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled').default('Draft'),
  document: Joi.string().optional().allow(null, ''),
});

const update = Joi.object({
  company: Joi.string().optional(),
  paymentNumber: Joi.string().optional(),
  paymentDate: Joi.date().optional(),
  paymentType: Joi.string().valid('Payment', 'Receipt'),
  partyType: Joi.string().valid('Customer', 'Supplier'),
  party: Joi.string().optional(),
  paymentMethod: Joi.string().valid('Cash', 'Bank'),
  account: Joi.string().optional(),
  currency: Joi.string().optional(),
  exchangeRate: Joi.number().min(0),
  amount: Joi.number().min(0),
  referenceNumber: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled'),
  document: Joi.string().optional().allow(null, ''),
});

module.exports = { create, update };
