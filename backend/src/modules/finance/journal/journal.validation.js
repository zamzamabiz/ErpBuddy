const Joi = require('joi');

const journalLineSchema = Joi.object({
  accountId: Joi.string().required().messages({
    'string.empty': 'Account is required',
    'any.required': 'Account is required'
  }),
  debit: Joi.number().min(0).default(0),
  credit: Joi.number().min(0).default(0),
  description: Joi.string().allow('').optional()
});

const validateCreateJournal = (data) => {
  const schema = Joi.object({
    date: Joi.date().required().messages({
      'date.base': 'Date must be valid',
      'any.required': 'Date is required'
    }),
    description: Joi.string().allow('').optional(),
    lines: Joi.array()
      .items(journalLineSchema)
      .min(2)
      .required()
      .messages({
        'array.min': 'At least 2 journal lines required',
        'any.required': 'Lines are required'
      })
  });

  return schema.validate(data);
};

const validateUpdateJournal = (data) => {
  const schema = Joi.object({
    date: Joi.date().optional(),
    description: Joi.string().allow('').optional(),
    lines: Joi.array()
      .items(journalLineSchema)
      .min(2)
      .optional()
      .messages({
        'array.min': 'At least 2 journal lines required'
      })
  });

  return schema.validate(data);
};

module.exports = {
  validateCreateJournal,
  validateUpdateJournal
};
