const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaxSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  taxCode: { type: String, required: true, unique: true },
  taxName: { type: String, required: true },
  taxType: { type: String, enum: ['Sales', 'Purchase', 'Withholding', 'Import', 'Export'], required: true },
  taxRate: { type: Number, required: true },
  taxAccount: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: false },
  isCompoundTax: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

TaxSchema.index({ company: 1, taxCode: 1 }, { unique: true });

module.exports = mongoose.model('Tax', TaxSchema);
