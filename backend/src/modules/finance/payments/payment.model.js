const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    reference: {
      type: String,
      required: true
      // unique index is tenant-scoped
    },
    type: {
      type: String,
      enum: ['payment', 'receipt'],
      required: true,
      index: true
    },
    cashAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Account',
      description: 'Cash/Bank account for the transaction'
    },
    counterAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Account',
      description: 'Expense/Revenue/Payable/Receivable account'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      default: ''
    },
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journal',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'payments',
    timestamps: true
  }
);

// Unique index: reference per tenant (exclude deleted)
paymentSchema.index({ tenantId: 1, reference: 1, deletedAt: 1 }, { unique: true, sparse: true, partialFilterExpression: { deletedAt: null } });

module.exports = mongoose.model('Payment', paymentSchema);
