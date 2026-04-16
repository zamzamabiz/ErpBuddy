const mongoose = require('mongoose');

/**
 * JOURNAL LINE MODEL - Line items for journal entries
 * Captures individual debit/credit entries with audit trail
 */
const journalLineSchema = new mongoose.Schema(
  {
    // Multi-tenant and document references
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Journal',
      index: true
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Account'
    },

    // Audit trail: capture account state at posting time (immutable)
    accountCode: {
      type: String,
      required: true
    },
    accountName: {
      type: String,
      required: true
    },
    accountType: {
      type: String,
      required: true
    },

    // Debit/Credit (mutually exclusive - only one should be non-zero)
    debit: {
      type: Number,
      min: 0,
      default: 0,
      get: (val) => parseFloat((val || 0).toFixed(2))
    },
    credit: {
      type: Number,
      min: 0,
      default: 0,
      get: (val) => parseFloat((val || 0).toFixed(2))
    },

    // Description for this line
    description: {
      type: String,
      default: ''
    },

    // Timestamp
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'journal_lines',
    getters: true
  }
);

// Indexes for efficient querying
journalLineSchema.index({ journalId: 1 });
journalLineSchema.index({ tenantId: 1, accountId: 1 });
journalLineSchema.index({ tenantId: 1, accountType: 1 });
journalLineSchema.index({ tenantId: 1, journalId: 1 });

module.exports = mongoose.model('JournalLine', journalLineSchema);
