const Joi = require('joi');

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  employee: Joi.string().required(),
  effectiveFrom: Joi.date().required(),
  basic: Joi.number().min(0).required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
  remarks: Joi.string().optional().allow('', null),
});

const update = Joi.object({
  effectiveFrom: Joi.date().optional(),
  basic: Joi.number().min(0),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  status: Joi.string().valid('Active', 'Inactive'),
  remarks: Joi.string().optional().allow('', null),
});

module.exports = { create, update };
