const Joi = require('joi');

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  payrollMonth: Joi.string().required(), // e.g. '2026-04'
  employee: Joi.string().required(),
  basic: Joi.number().min(0).required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  netPay: Joi.number().min(0).required(),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled').default('Draft'),
});

const update = Joi.object({
  basic: Joi.number().min(0),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  netPay: Joi.number().min(0),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled'),
});

module.exports = { create, update };
