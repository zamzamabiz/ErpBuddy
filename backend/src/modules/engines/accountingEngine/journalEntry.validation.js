const Joi = require('joi');

const line = Joi.object({
  account: Joi.string().required(),
  debit: Joi.number().min(0).default(0),
  credit: Joi.number().min(0).default(0),
  description: Joi.string().allow('', null)
});

const create = Joi.object({
  company: Joi.string().required(),
  journalNumber: Joi.string().required(),
  journalDate: Joi.date().required(),
  document: Joi.string().optional().allow(null, ''),
  referenceNumber: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  lines: Joi.array().items(line).min(1).required(),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled').default('Draft')
});

const update = Joi.object({
  company: Joi.string().optional(),
  journalNumber: Joi.string().optional(),
  journalDate: Joi.date().optional(),
  document: Joi.string().optional().allow(null, ''),
  referenceNumber: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  lines: Joi.array().items(line).min(1),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled')
});

module.exports = { create, update };
