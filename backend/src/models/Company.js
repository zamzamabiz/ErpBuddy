const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  // Multi-tenant isolation: Each company belongs to a specific tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required for multi-tenant isolation']
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for multi-tenant uniqueness (tenantId + email)
CompanySchema.index({ tenantId: 1, email: 1 }, { unique: true });

// Pre-save middleware to ensure tenantId is always present
CompanySchema.pre('save', function(next) {
  if (!this.tenantId) {
    const error = new Error('Tenant ID is required');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Company', CompanySchema);