const Joi = require('joi');

const chartOfAccountsSchema = Joi.object({
  accountCode: Joi.string().required(),
  accountTitle: Joi.string().required(),
  accountType: Joi.string().valid('Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'CostOfSales').required(),
  parentAccount: Joi.string().optional().allow(null, ''),
  balanceType: Joi.string().valid('Debit', 'Credit').required(),
  openingBalance: Joi.number().default(0),
  isGroup: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  level: Joi.number().default(1)
});

module.exports = { chartOfAccountsSchema };
