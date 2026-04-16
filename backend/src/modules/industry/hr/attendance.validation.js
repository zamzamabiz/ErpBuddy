const Joi = require('joi');

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  employee: Joi.string().required(),
  date: Joi.date().required(),
  status: Joi.string().valid('Present', 'Absent', 'Leave', 'Half Day', 'Holiday').required(),
  inTime: Joi.string().optional().allow('', null),
  outTime: Joi.string().optional().allow('', null),
  remarks: Joi.string().optional().allow('', null),
});

const update = Joi.object({
  status: Joi.string().valid('Present', 'Absent', 'Leave', 'Half Day', 'Holiday'),
  inTime: Joi.string().optional().allow('', null),
  outTime: Joi.string().optional().allow('', null),
  remarks: Joi.string().optional().allow('', null),
});

module.exports = { create, update };
