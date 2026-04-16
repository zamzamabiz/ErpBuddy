const mongoose = require('mongoose');
const BaseModelSchema = require('@shared/base.model');

const CustomersSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  customerCode: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  displayName: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  mobile: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  country: { type: String, trim: true },
  taxNumber: { type: String, trim: true },
  creditLimit: { type: Number, default: 0 },
  paymentTerms: { type: String, trim: true },
  currency: { type: String, trim: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true }
});

CustomersSchema.index({ companyId: 1, customerCode: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
CustomersSchema.add(BaseModelSchema);

module.exports = mongoose.model('Customer', CustomersSchema);
