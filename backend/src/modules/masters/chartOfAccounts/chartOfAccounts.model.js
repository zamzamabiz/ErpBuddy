const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChartOfAccountsSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  accountCode: { type: String, required: true, unique: true },
  accountTitle: { type: String, required: true },
  accountType: {
    type: String,
    enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'CostOfSales'],
    required: true
  },
  parentAccount: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts', default: null },
  balanceType: { type: String, enum: ['Debit', 'Credit'], required: true },
  openingBalance: { type: Number, default: 0 },
  isGroup: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  level: { type: Number, default: 1 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ChartOfAccountsSchema.index({ company: 1, accountCode: 1 }, { unique: true });

module.exports = mongoose.model('ChartOfAccounts', ChartOfAccountsSchema);
