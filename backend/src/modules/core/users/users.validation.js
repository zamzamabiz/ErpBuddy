const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
  roleId: Joi.string().required(),
  phone: Joi.string().allow(''),
  avatar: Joi.string().allow(''),
  isActive: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
});

exports.update = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  username: Joi.string(),
  roleId: Joi.string(),
  phone: Joi.string().allow(''),
  avatar: Joi.string().allow(''),
  isActive: Joi.boolean(),
  status: Joi.string().valid('active', 'inactive'),
});

exports.changePassword = Joi.object({
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});

exports.resetPassword = Joi.object({
  newPassword: Joi.string().min(6).required(),
});
