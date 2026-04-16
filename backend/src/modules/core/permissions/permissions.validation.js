const Joi = require('joi');

exports.create = Joi.object({
  module: Joi.string().required(),
  action: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive'),
});

exports.update = Joi.object({
  module: Joi.string(),
  action: Joi.string(),
  name: Joi.string(),
  description: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive'),
});

exports.seed = Joi.object({
  seedList: Joi.array().items(
    Joi.object({
      module: Joi.string().required(),
      action: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      status: Joi.string().valid('active', 'inactive'),
    })
  ).required()
});
