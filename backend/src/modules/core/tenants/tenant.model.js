const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  country: { type: String },
  subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
  subscriptionStatus: { type: String, enum: ['active', 'suspended', 'trial'], default: 'trial' },
  maxUsers: { type: Number, default: 5 },
  maxCompanies: { type: Number, default: 1 },
  storageLimit: { type: Number, default: 1024 }, // MB
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tenantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);