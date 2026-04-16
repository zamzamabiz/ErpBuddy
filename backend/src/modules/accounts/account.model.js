const mongoose = require('mongoose');
const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    // MULTI-TENANT
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true
    },

    // ACCOUNT IDENTIFICATION
    code: {
      type: String,
      required: [true, 'Account code is required'],
      pattern: /^\d{8}$/, // 8-digit format
      index: true
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true
    },
    description: String,

    // HIERARCHY
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
      index: true
    },
    level: {
      type: Number,
      default: 1,
      enum: [1, 2, 3, 4], // 4-level hierarchy
      index: true
    },

    // CLASSIFICATION
    type: {
      type: String,
      enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
      required: [true, 'Account type is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true
      // Examples: 'Current', 'Fixed', 'Operational', 'Trading'
    },
    subCategory: String,
    // Examples for Assets: 'Cash', 'Receivables', 'Inventory'
    // Examples for Liabilities: 'Payables', 'Loans', 'Accrued'
    // Examples for Revenue: 'Sales', 'Service', 'Other'

    // CONTROL
    isSystem: {
      type: Boolean,
      default: true,
      // true = created by system, cannot be deleted
      // false = user-created, can be disabled
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // POSTING CONTROL
    allowPosting: {
      type: Boolean,
      default: true
      // false = header/parent account only, no direct postings
    },

    // BALANCE TRACKING
    openingBalance: {
      type: Number,
      default: 0
    },
    normalBalance: {
      type: String,
      enum: ['Debit', 'Credit'],
      default: 'Debit'
      // Asset/Expense: Debit, Liability/Revenue: Credit
    },

    // AUDIT TRAIL
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    disabledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    disabledAt: Date,

    // METADATA
    tags: [String],
    notes: String
  },
  {
    timestamps: true,
    collection: 'accounts'
  }
);

// ============================================
// INDEXES
// ============================================

// Unique code per tenant
accountSchema.index({ tenantId: 1, code: 1 }, { unique: true });

// Unique name per tenant per parent
accountSchema.index({ tenantId: 1, parentId: 1, name: 1 }, { unique: true });

// Query active accounts by type
accountSchema.index({ tenantId: 1, type: 1, isActive: 1 });

// Query by category
accountSchema.index({ tenantId: 1, category: 1, isActive: 1 });

// Parent-child queries
accountSchema.index({ tenantId: 1, parentId: 1, level: 1 });

// ============================================
// VIRTUALS
// ============================================

// Get full path: Assets > Current > Cash > Cash in Hand
accountSchema.virtual('fullPath').get(function() {
  return `${this.code} - ${this.name}`;
});

// ============================================
// METHODS
// ============================================

/**
 * Can this account accept direct postings?
 */
accountSchema.methods.canPost = function() {
  return this.allowPosting && this.isActive;
};

/**
 * Get account level name
 */
accountSchema.methods.getLevelName = function() {
  const names = { 1: 'Header', 2: 'Group', 3: 'Subgroup', 4: 'Detailed' };
  return names[this.level] || 'Unknown';
};

/**
 * Get normal balance side
 */
accountSchema.methods.getNormalSide = function() {
  return this.normalBalance; // 'Debit' or 'Credit'
};

// ============================================
// STATICS
// ============================================

/**
 * Get account with all ancestors (used for reporting)
 */
accountSchema.statics.getWithAncestors = async function(accountId) {
  const Account = this;
  const account = await Account.findById(accountId);
  if (!account) return null;

  const ancestors = [];
  let current = account;
  while (current.parentId) {
    const parent = await Account.findById(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return {
    account,
    ancestors,
    path: [...ancestors, account]
  };
};

/**
 * Get account with all descendants
 */
accountSchema.statics.getWithDescendants = async function(accountId, tenantId) {
  const Account = this;
  const account = await Account.findById(accountId);
  if (!account) return null;

  const descendants = [];
  const queue = [account];

  while (queue.length > 0) {
    const current = queue.shift();
    const children = await Account.find({
      tenantId,
      parentId: current._id,
      isActive: true
    });
    descendants.push(...children);
    queue.push(...children);
  }

  return {
    account,
    descendants,
    tree: buildTree(account, descendants)
  };
};

/**
 * Helper to build tree structure
 */
function buildTree(root, all) {
  const map = {};
  all.forEach(item => {
    map[item._id.toString()] = { ...item.toObject(), children: [] };
  });

  const tree = { ...root.toObject(), children: [] };
  all.forEach(item => {
    if (item.parentId && item.parentId.toString() === root._id.toString()) {
      tree.children.push(map[item._id.toString()]);
    }
  });

  return tree;
}

// ============================================
// PRE/POST HOOKS
// ============================================

// Validate code format on save
accountSchema.pre('save', function(next) {
  if (this.code && !/^\d{8}$/.test(this.code)) {
    return next(new Error('Account code must be 8 digits'));
  }
  next();
});

// ============================================
// EXPORT
// ============================================

module.exports = mongoose.model('Account', accountSchema);
