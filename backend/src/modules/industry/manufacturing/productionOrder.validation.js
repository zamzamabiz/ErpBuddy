const Joi = require('joi');

const material = Joi.object({
  item: Joi.string().required(),
  quantity: Joi.number().min(0.0001).required(),
  unit: Joi.string().required()
});

const output = Joi.object({
  item: Joi.string().required(),
  quantity: Joi.number().min(0.0001).required(),
  unit: Joi.string().required()
});

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  productionNumber: Joi.string().required(),
  productionDate: Joi.date().required(),
  bom: Joi.string().required(),
  materials: Joi.array().items(material).min(1).required(),
  outputs: Joi.array().items(output).min(1).required(),
  wipWarehouse: Joi.string().required(),
  fgWarehouse: Joi.string().required(),
  status: Joi.string().valid('Draft', 'In Progress', 'Completed', 'Cancelled').default('Draft'),
  totalCost: Joi.number().min(0),
  document: Joi.string().optional().allow(null, ''),
});

const update = Joi.object({
  tenantId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  productionNumber: Joi.string().optional(),
  productionDate: Joi.date().optional(),
  bom: Joi.string().optional(),
  materials: Joi.array().items(material).min(1),
  outputs: Joi.array().items(output).min(1),
  wipWarehouse: Joi.string().optional(),
  fgWarehouse: Joi.string().optional(),
  status: Joi.string().valid('Draft', 'In Progress', 'Completed', 'Cancelled'),
  totalCost: Joi.number().min(0),
  document: Joi.string().optional().allow(null, ''),
});

module.exports = { create, update };
