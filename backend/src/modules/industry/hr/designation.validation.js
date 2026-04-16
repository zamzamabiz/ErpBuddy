const Joi = require('joi');

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  name: Joi.string().required(),
  code: Joi.string().required(),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
});

const update = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
});

module.exports = { create, update };
