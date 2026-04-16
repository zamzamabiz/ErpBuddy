const mongoose = require('mongoose');
const BaseModelSchema = require('@shared/base.model');

const CompanySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true, trim: true },
  legalName: { type: String, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  country: { type: String, trim: true },
  currency: { type: String, trim: true },
  timezone: { type: String, trim: true },
  address: { type: String, trim: true },
  taxNumber: { type: String, trim: true },
  logo: { type: String, trim: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] }
});

CompanySchema.add(BaseModelSchema);

module.exports = mongoose.model('Company', CompanySchema);
