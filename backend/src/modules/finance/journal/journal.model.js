const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * JOURNAL MODEL - Master document for accounting entries
 * Implements double-entry bookkeeping with audit trail
 */
const journalSchema = new Schema(
  {
    // Multi-tenant isolation
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },

    // Core accounting fields
    date: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    reference: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },

    // Journal source and status
    source: {
      type: String,
      enum: ['SALE', 'PURCHASE', 'MANUAL', 'PAYMENT', 'RECEIPT'],
      default: 'MANUAL'
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      sparse: true
    },

    // Status tracking
    status: {
      type: String,
      enum: ['DRAFT', 'POSTED'],
      default: 'DRAFT'
    },

    // Accounting totals
    totalDebit: {
      type: Number,
      default: 0,
      get: (val) => parseFloat(val.toFixed(2))
    },
    totalCredit: {
      type: Number,
      default: 0,
      get: (val) => parseFloat(val.toFixed(2))
    },
    isBalanced: {
      type: Boolean,
      default: false
    },

    // Audit trail
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    postedAt: {
      type: Date,
      sparse: true
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    getters: true
  }
);

// Indexes for efficient querying (exclude deleted)
journalSchema.index({ tenantId: 1, date: -1, deletedAt: 1 });
journalSchema.index({ tenantId: 1, source: 1, deletedAt: 1 });
journalSchema.index({ tenantId: 1, status: 1, deletedAt: 1 });
journalSchema.index({ tenantId: 1, reference: 1, deletedAt: 1 }, { unique: true, sparse: true, partialFilterExpression: { deletedAt: null } });
journalSchema.index({ tenantId: 1, status: 1, date: -1, deletedAt: 1 });

module.exports = mongoose.model('Journal', journalSchema);
