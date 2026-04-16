const Joi = require('joi');

const item = Joi.object({
  item: Joi.string().required(),
  quantity: Joi.number().min(0.0001).optional(),
  unitPrice: Joi.number().min(0).required(),
  totalPrice: Joi.number().min(0).required(),
  bags: Joi.number().min(0).optional(),
  weightPerBag: Joi.number().min(0).optional()
});

const create = Joi.object({
  company: Joi.string().required(),
  salesNumber: Joi.string().required(),
  salesDate: Joi.date().required(),
  customer: Joi.string().required(),
  customerAccountId: Joi.string().optional(),
  salesAccountId: Joi.string().optional(),
  warehouse: Joi.string().required(),
  currency: Joi.string().required(),
  exchangeRate: Joi.number().min(0).default(1),
  commodity: Joi.string().optional(),
  broker: Joi.string().optional(),
  brokerCommission: Joi.number().min(0).optional(),
  items: Joi.array().items(item).min(1).required(),
  totalAmount: Joi.number().min(0).required(),
  taxAmount: Joi.number().min(0).default(0),
  netAmount: Joi.number().min(0).required(),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled').default('Draft'),
  document: Joi.string().optional().allow(null, ''),
});

const update = Joi.object({
  company: Joi.string().optional(),
  salesNumber: Joi.string().optional(),
  salesDate: Joi.date().optional(),
  customer: Joi.string().optional(),
  customerAccountId: Joi.string().optional(),
  salesAccountId: Joi.string().optional(),
  warehouse: Joi.string().optional(),
  currency: Joi.string().optional(),
  exchangeRate: Joi.number().min(0),
  commodity: Joi.string().optional(),
  broker: Joi.string().optional(),
  brokerCommission: Joi.number().min(0),
  items: Joi.array().items(item).min(1),
  totalAmount: Joi.number().min(0),
  taxAmount: Joi.number().min(0),
  netAmount: Joi.number().min(0),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled'),
  document: Joi.string().optional().allow(null, ''),
});

module.exports = { create, update };
