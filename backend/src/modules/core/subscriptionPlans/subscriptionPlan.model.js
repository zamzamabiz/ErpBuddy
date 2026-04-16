const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  priceMonthly: { type: Number, required: true },
  priceYearly: { type: Number, required: true },
  maxUsers: { type: Number, required: true },
  maxCompanies: { type: Number, required: true },
  maxBranches: { type: Number, required: true },
  modulesIncluded: [{ type: String }],
  storageLimit: { type: Number, required: true }, // MB
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

subscriptionPlanSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);