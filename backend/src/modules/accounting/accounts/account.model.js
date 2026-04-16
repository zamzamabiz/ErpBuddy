const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'income', 'expense'],
    index: true
  },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  level: { type: Number, default: 0 }, // 0 = root, 1 = child, 2 = grandchild, etc.
  category: { type: String, default: 'Detail' }, // Header, Group, Sub-group, Detail
  description: { type: String, default: '' },
  allowPosting: { type: Boolean, default: false }, // Can transactions be posted to this account?
  normalBalance: { 
    type: String, 
    enum: ['Debit', 'Credit'],
    required: true,
    default: 'Debit'
  }, // Normal balance direction
  isActive: { type: Boolean, default: true, index: true },
  isSystem: { type: Boolean, default: false, index: true }, // System account (immutable)
  balance: { type: Number, default: 0 }, // Current balance (calculated)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

// UNIQUE INDEX: Ensure unique account code per tenant (exclude deleted)
accountSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, sparse: true, partialFilterExpression: { deletedAt: null } }
);

// COMPOUND INDEX for efficient tree queries (exclude deleted)
accountSchema.index({ tenantId: 1, parentId: 1, isActive: 1, deletedAt: 1 });

// INDEX for type queries (exclude deleted)
accountSchema.index({ tenantId: 1, type: 1, isActive: 1, deletedAt: 1 });

// INDEX for system accounts (exclude deleted)
accountSchema.index({ tenantId: 1, isSystem: 1, deletedAt: 1 });

// INDEX for posting-level accounts (exclude deleted)
accountSchema.index({ tenantId: 1, allowPosting: 1, isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('Account', accountSchema);
