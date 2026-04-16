const mongoose = require('mongoose');

/**
 * CHART OF ACCOUNTS MODEL - Multi-tenant accounting structure
 * Implements proper account hierarchy and posting controls
 */
const coaSchema = new mongoose.Schema({
  // Multi-tenant isolation (CRITICAL)
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Account identification
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  code: { 
    type: String, 
    required: true,
    trim: true
  },

  // Account classification
  type: { 
    type: String, 
    required: true,
    enum: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']
  },

  // Hierarchy support
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount',
    default: null
  },
  level: {
    type: Number,
    default: 0, // 0 = root, 1 = child, 2 = grandchild, etc.
    min: 0
  },

  // Posting controls
  allowPosting: {
    type: Boolean,
    default: true // Only leaf accounts should allow posting
  },

  // Normal balance (DEBIT or CREDIT)
  normalBalance: {
    type: String,
    enum: ['DEBIT', 'CREDIT'],
    default: 'DEBIT'
  },

  // System account protection
  isSystem: { 
    type: Boolean, 
    default: false 
  },
  
  // Company association
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' 
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Compound index for unique code per tenant (CRITICAL)
coaSchema.index({ tenantId: 1, code: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

// Indexes for efficient querying
coaSchema.index({ tenantId: 1, type: 1, deletedAt: 1 });
coaSchema.index({ tenantId: 1, parentId: 1, deletedAt: 1 });
coaSchema.index({ tenantId: 1, allowPosting: 1, deletedAt: 1 });
coaSchema.index({ tenantId: 1, isSystem: 1, deletedAt: 1 });

// Pre-save hook to protect system accounts
coaSchema.pre('save', function(next) {
  // Prevent modification of system accounts (except during creation)
  if (!this.isNew && this.isSystem) {
    // Only allow updates to non-critical fields
    if (this.isModified('name') || this.isModified('code') || this.isModified('type') || this.isModified('isSystem')) {
      return next(new Error('Cannot modify system account properties'));
    }
  }
  next();
});

// Pre-delete hook to prevent deletion of system accounts
coaSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystem) {
    return next(new Error('Cannot delete system account'));
  }
  next();
});

// Static method to find account by code and tenant
coaSchema.statics.findByCode = function(tenantId, code) {
  return this.findOne({ tenantId, code, deletedAt: null });
};

// Static method to find account by ID and tenant
coaSchema.statics.findByTenant = function(tenantId) {
  return this.find({ tenantId, deletedAt: null }).sort({ code: 1 });
};

module.exports = mongoose.model('ChartOfAccount', coaSchema);