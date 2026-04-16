const Joi = require('joi');

const documentSchema = Joi.object({
  documentType: Joi.string().required(),
  documentNumber: Joi.string().optional(),
  documentDate: Joi.date().required(),
  referenceNumber: Joi.string().optional().allow('', null),
  party: Joi.string().optional().allow('', null),
  currency: Joi.string().optional().allow('', null),
  exchangeRate: Joi.number().default(1),
  totalAmount: Joi.number().default(0),
  taxAmount: Joi.number().default(0),
  netAmount: Joi.number().default(0),
  status: Joi.string().valid('Draft', 'Posted', 'Cancelled').default('Draft'),
  remarks: Joi.string().optional().allow('', null)
});

module.exports = { documentSchema };
