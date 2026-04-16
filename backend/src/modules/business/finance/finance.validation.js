const Joi = require('joi');

const generalLedger = Joi.object({
  accountId: Joi.string().required(),
  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional()
});

const trialBalance = Joi.object({
  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional()
});

const profitLoss = Joi.object({
  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional()
});

const balanceSheet = Joi.object({
  date: Joi.date().optional()
});

module.exports = { generalLedger, trialBalance, profitLoss, balanceSheet };
