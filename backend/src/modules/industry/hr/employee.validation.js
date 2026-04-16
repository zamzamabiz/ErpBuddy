const Joi = require('joi');

const create = Joi.object({
  tenantId: Joi.string().required(),
  companyId: Joi.string().required(),
  employeeCode: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().allow('', null),
  department: Joi.string().optional().allow('', null),
  designation: Joi.string().optional().allow('', null),
  dateOfJoining: Joi.date().optional().allow(null),
  dateOfBirth: Joi.date().optional().allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
});

const update = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().allow('', null),
  department: Joi.string().optional().allow('', null),
  designation: Joi.string().optional().allow('', null),
  dateOfJoining: Joi.date().optional().allow(null),
  dateOfBirth: Joi.date().optional().allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').optional(),
});

module.exports = { create, update };
