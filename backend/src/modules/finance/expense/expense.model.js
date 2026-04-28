const mongoose = require('mongoose');
const { Schema } = mongoose;

const expenseSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  expenseDate: { type: Date, required: true },
  expenseType: { 
    type: String, 
    enum: ['transport', 'labour', 'packing', 'loading', 'brokerage', 'utilities', 'rent', 'salaries', 'other'],
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  paymentAccountId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Account', 
    required: true,
    description: 'Cash/Bank account credited'
  },
  expenseAccountId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Account', 
    required: true,
    description: 'Expense account debited'
  },
  referenceId: { 
    type: Schema.Types.ObjectId, 
    default: null,
    description: 'Linked document (saleId, purchaseId, etc.)'
  },
  referenceType: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'MILLING', 'GENERAL', null],
    default: 'GENERAL'
  },
  vendorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Supplier', 
    default: null,
    description: 'Optional vendor reference'
  },
  invoiceNumber: { type: String, default: '' },
  journalId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Journal', 
    default: null,
    description: 'Auto-created journal entry'
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Posted', 'Cancelled'], 
    default: 'Draft' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Index for tenant isolation
expenseSchema.index({ tenantId: 1, expenseDate: -1 });
expenseSchema.index({ referenceId: 1, referenceType: 1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);