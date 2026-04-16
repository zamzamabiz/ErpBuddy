const Joi = require('joi');

const item = Joi.object({
  item: Joi.string().required(),
  quantity: Joi.number().min(0.0001).required(),
  unit: Joi.string().required()
});

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  bomNumber: Joi.string().required(),
  product: Joi.string().required(),
  version: Joi.string().allow('', null),
  items: Joi.array().items(item).min(1).required(),
  remarks: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const update = Joi.object({
  tenantId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  bomNumber: Joi.string().optional(),
  product: Joi.string().optional(),
  version: Joi.string().allow('', null),
  items: Joi.array().items(item).min(1),
  remarks: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive')
});

module.exports = { create, update };
