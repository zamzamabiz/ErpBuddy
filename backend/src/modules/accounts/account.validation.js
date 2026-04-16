const Joi = require('joi');

// ============================================
// CREATE ACCOUNT VALIDATION
// ============================================

const createAccountSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(3)
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Account name is required',
      'string.min': 'Account name must be at least 3 characters',
      'string.max': 'Account name must not exceed 100 characters'
    }),

  description: Joi.string()
    .max(500)
    .trim()
    .optional(),

  parentId: Joi.string()
    .optional()
    .allow(null)
    .pattern(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId
    .messages({
      'string.pattern.base': 'Invalid parent account ID'
    }),

  type: Joi.string()
    .required()
    .valid('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')
    .messages({
      'any.required': 'Account type is required',
      'any.only': 'Type must be one of: Asset, Liability, Equity, Revenue, Expense'
    }),

  category: Joi.string()
    .required()
    .min(2)
    .max(50)
    .trim()
    .messages({
      'string.empty': 'Category is required',
      'string.min': 'Category must be at least 2 characters'
    }),

  subCategory: Joi.string()
    .optional()
    .max(50)
    .trim(),

  allowPosting: Joi.boolean()
    .optional()
    .default(true),

  openingBalance: Joi.number()
    .optional()
    .default(0),

  normalBalance: Joi.string()
    .optional()
    .valid('Debit', 'Credit')
    .default('Debit'),

  tags: Joi.array()
    .items(Joi.string().trim())
    .optional(),

  notes: Joi.string()
    .max(500)
    .optional()
});

// ============================================
// UPDATE ACCOUNT VALIDATION
// ============================================

const updateAccountSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .optional(),

  description: Joi.string()
    .max(500)
    .trim()
    .optional(),

  category: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional(),

  subCategory: Joi.string()
    .max(50)
    .trim()
    .optional(),

  allowPosting: Joi.boolean()
    .optional(),

  tags: Joi.array()
    .items(Joi.string().trim())
    .optional(),

  notes: Joi.string()
    .max(500)
    .optional()
});

// ============================================
// DISABLE ACCOUNT VALIDATION
// ============================================

const disableAccountSchema = Joi.object({
  reason: Joi.string()
    .max(500)
    .optional()
});

// ============================================
// QUERY FILTERS VALIDATION
// ============================================

const listAccountsSchema = Joi.object({
  type: Joi.string()
    .valid('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')
    .optional(),

  category: Joi.string()
    .optional(),

  isActive: Joi.boolean()
    .optional(),

  parentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null),

  level: Joi.number()
    .valid(1, 2, 3, 4)
    .optional(),

  allowPosting: Joi.boolean()
    .optional(),

  search: Joi.string()
    .max(100)
    .optional(),

  limit: Joi.number()
    .min(1)
    .max(1000)
    .default(100),

  offset: Joi.number()
    .min(0)
    .default(0)
});

// ============================================
// EXPORT
// ============================================

module.exports = {
  createAccountSchema,
  updateAccountSchema,
  disableAccountSchema,
  listAccountsSchema
};
