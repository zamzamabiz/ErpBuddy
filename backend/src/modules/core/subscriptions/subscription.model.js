const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['trial', 'active', 'expired', 'cancelled'], default: 'trial' },
  autoRenew: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

subscriptionSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.status = 'cancelled';
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);