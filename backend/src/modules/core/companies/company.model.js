const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  legalName: { type: String },
  registrationNumber: { type: String },
  taxNumber: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  country: { type: String },
  currency: { type: String },
  fiscalYearStart: { type: Date },
  isActive: { type: Boolean, default: true },
  // DEFAULT ACCOUNTS FOR JOURNAL POSTING
  expenseAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  payablesAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

companySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Company', companySchema);