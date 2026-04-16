const mongoose = require('mongoose');

/**
 * JOURNAL MODEL - Master Document
 * Stores journal entries (accounting transactions)
 * Double-entry system: Total Debit = Total Credit
 */
const journalSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reference: {
    type: String,
    default: null,
    // Sales Invoice: SI-0001, Purchase Bill: PB-0001, Manual: J-0001
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  source: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'MANUAL', 'PAYMENT', 'RECEIPT'],
    default: 'MANUAL',
    index: true
  },
  // Reference to original document (SalesInvoice._id, PurchaseBill._id, etc.)
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'POSTED'],
    default: 'DRAFT',
    index: true
  },
  // Totals (calculated)
  totalDebit: {
    type: Number,
    default: 0
  },
  totalCredit: {
    type: Number,
    default: 0
  },
  isBalanced: {
    type: Boolean,
    default: false
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  postedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
journalSchema.index({ tenantId: 1, date: -1 });
journalSchema.index({ tenantId: 1, source: 1 });
journalSchema.index({ tenantId: 1, status: 1 });
journalSchema.index({ tenantId: 1, reference: 1 }, { sparse: true });
journalSchema.index({ sourceId: 1 }, { sparse: true });

// Compound index for tenant + date + status
journalSchema.index({ tenantId: 1, status: 1, date: -1 });

module.exports = mongoose.model('Journal', journalSchema);
