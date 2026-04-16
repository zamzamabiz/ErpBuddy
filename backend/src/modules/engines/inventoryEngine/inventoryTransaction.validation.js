const Joi = require('joi');

const create = Joi.object({
  company: Joi.string().required(),
  item: Joi.string().required(),
  warehouse: Joi.string().required(),
  document: Joi.string().optional().allow(null, ''),
  transactionType: Joi.string().valid('Purchase', 'Sale', 'Transfer', 'Adjustment', 'Production').required(),
  quantityIn: Joi.number().min(0).default(0),
  quantityOut: Joi.number().min(0).default(0),
  unitCost: Joi.number().min(0).default(0),
  totalCost: Joi.number().min(0).default(0),
  transactionDate: Joi.date().required(),
  remarks: Joi.string().allow('', null)
});

const update = Joi.object({
  company: Joi.string().optional(),
  item: Joi.string().optional(),
  warehouse: Joi.string().optional(),
  document: Joi.string().optional().allow(null, ''),
  transactionType: Joi.string().valid('Purchase', 'Sale', 'Transfer', 'Adjustment', 'Production').optional(),
  quantityIn: Joi.number().min(0),
  quantityOut: Joi.number().min(0),
  unitCost: Joi.number().min(0),
  totalCost: Joi.number().min(0),
  transactionDate: Joi.date().optional(),
  remarks: Joi.string().allow('', null)
});

module.exports = { create, update };
