const Joi = require('joi');

const item = Joi.object({
  item: Joi.string().length(24).hex().required(),
  quantity: Joi.number().min(0.0001).required(),
  unitCost: Joi.number().min(0).required(),
  totalCost: Joi.number().min(0).required()
});

const create = Joi.object({
  company: Joi.string().length(24).hex().required(),
  purchaseNumber: Joi.string().required(),
  purchaseDate: Joi.date().required(),
  supplier: Joi.string().length(24).hex().required(),
  warehouse: Joi.string().length(24).hex().required(),
  currency: Joi.string().length(24).hex().required(),
  exchangeRate: Joi.number().min(0).default(1),
  items: Joi.array().items(item).min(1).required(),
  totalAmount: Joi.number().min(0).required(),
  taxAmount: Joi.number().min(0).default(0),
  netAmount: Joi.number().min(0).required(),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled').default('Draft'),
  supplierAccountId: Joi.string().length(24).hex().optional(),
  expenseAccountId: Joi.string().length(24).hex().optional(),
  document: Joi.string().length(24).hex().optional().allow(null, ''),
});

const update = Joi.object({
  company: Joi.string().length(24).hex().optional(),
  purchaseNumber: Joi.string().optional(),
  purchaseDate: Joi.date().optional(),
  supplier: Joi.string().length(24).hex().optional(),
  warehouse: Joi.string().length(24).hex().optional(),
  currency: Joi.string().length(24).hex().optional(),
  exchangeRate: Joi.number().min(0),
  items: Joi.array().items(item).min(1),
  totalAmount: Joi.number().min(0),
  taxAmount: Joi.number().min(0),
  netAmount: Joi.number().min(0),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled'),
  supplierAccountId: Joi.string().length(24).hex().optional(),
  expenseAccountId: Joi.string().length(24).hex().optional(),
  document: Joi.string().length(24).hex().optional().allow(null, ''),
});

module.exports = { create, update };
