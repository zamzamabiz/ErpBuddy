const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  paymentNumber: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  paymentType: { type: String, enum: ['Payment', 'Receipt'], required: true },
  partyType: { type: String, enum: ['Customer', 'Supplier'], required: true },
  party: { type: Schema.Types.ObjectId, required: true },
  partyAccountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts', description: 'Supplier Payable or Customer Receivable account' },
  paymentMethod: { type: String, enum: ['Cash', 'Bank'], required: true },
  account: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: true, description: 'Cash or Bank account' },
  currency: { type: Schema.Types.ObjectId, ref: 'Currency', required: true },
  exchangeRate: { type: Number, default: 1 },
  amount: { type: Number, required: true },
  referenceNumber: { type: String },
  remarks: { type: String },
  status: { type: String, enum: ['Draft', 'Posted', 'Cancelled'], default: 'Draft' },
  journalId: { type: Schema.Types.ObjectId, ref: 'Journal' },
  document: { type: Schema.Types.ObjectId, ref: 'Document' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.index({ company: 1, paymentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
