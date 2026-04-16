const Joi = require('joi');

const validateCreatePayment = (data) => {
  const schema = Joi.object({
    date: Joi.date().required().messages({
      'date.base': 'Date must be valid',
      'any.required': 'Date is required'
    }),
    type: Joi.string()
      .valid('payment', 'receipt')
      .required()
      .messages({
        'any.only': 'Type must be "payment" or "receipt"',
        'any.required': 'Type is required'
      }),
    cashAccountId: Joi.string().required().messages({
      'string.empty': 'Cash/Bank account is required',
      'any.required': 'Cash/Bank account is required'
    }),
    counterAccountId: Joi.string().required().messages({
      'string.empty': 'Expense/Revenue account is required',
      'any.required': 'Expense/Revenue account is required'
    }),
    amount: Joi.number()
      .positive()
      .required()
      .messages({
        'number.positive': 'Amount must be greater than 0',
        'any.required': 'Amount is required'
      }),
    description: Joi.string().allow('').optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateCreatePayment
};
