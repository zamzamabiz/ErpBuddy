const Joi = require('joi');

const create = Joi.object({
  companyId: Joi.string().required(),
  employeeId: Joi.string().required(),
  payPeriodStart: Joi.date().required(),
  payPeriodEnd: Joi.date().required(),
  basicSalary: Joi.number().min(0).required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  netSalary: Joi.number().min(0).required(),
  documentNo: Joi.string().required(),
  status: Joi.string().valid('Draft', 'Processed', 'Posted', 'Paid').default('Draft'),
});

const update = Joi.object({
  basicSalary: Joi.number().min(0),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  netSalary: Joi.number().min(0),
  status: Joi.string().valid('Draft', 'Processed', 'Posted', 'Paid'),
});

module.exports = { create, update };
