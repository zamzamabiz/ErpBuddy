const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  isSystemRole: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
});

exports.update = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow(''),
  isSystemRole: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
});

exports.assignPermissions = Joi.object({
  permissions: Joi.array().items(Joi.string()).required(),
});
