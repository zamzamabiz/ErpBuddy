const Joi = require('joi');

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  employee: Joi.string().required(),
  leaveType: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string().valid('Pending', 'Approved', 'Rejected', 'Cancelled').default('Pending'),
  reason: Joi.string().optional().allow('', null),
  remarks: Joi.string().optional().allow('', null),
});

const update = Joi.object({
  leaveType: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string().valid('Pending', 'Approved', 'Rejected', 'Cancelled'),
  reason: Joi.string().optional().allow('', null),
  remarks: Joi.string().optional().allow('', null),
});

module.exports = { create, update };
