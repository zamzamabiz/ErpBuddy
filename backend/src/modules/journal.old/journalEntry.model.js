const mongoose = require('mongoose');

/**
 * JOURNAL ENTRY MODEL - Line Items
 * Individual debit/credit lines in a journal
 * Double-entry: each entry has either debit OR credit
 */
const journalEntrySchema = new mongoose.Schema({
  journalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true,
    index: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true,
    // Validation: must be allowPosting=true account
  },
  // Account details at time of posting (for audit trail)
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
    required: true,
    enum: ['asset', 'liability', 'equity', 'income', 'expense']
  },
  // Amounts - only one should be non-zero per entry
  debit: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  },
  // Description for this line
  description: {
    type: String,
    default: '',
    trim: true
  },
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for efficient querying
journalEntrySchema.index({ journalId: 1 });
journalEntrySchema.index({ tenantId: 1, accountId: 1 });
journalEntrySchema.index({ tenantId: 1, accountType: 1 });

// Compound index for tenant + journal
journalEntrySchema.index({ tenantId: 1, journalId: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
