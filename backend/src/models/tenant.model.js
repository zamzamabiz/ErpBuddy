const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['trial', 'basic', 'professional', 'enterprise'],
    default: 'trial'
  },
  subscriptionExpiry: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  settings: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
tenantSchema.index({ email: 1 }, { unique: true });
tenantSchema.index({ name: 1, createdBy: 1 }, { unique: true });

// Pre-save middleware
tenantSchema.pre('save', function(next) {
  // Auto-set subscriptionExpiry to 30 days from now if not provided
  if (!this.subscriptionExpiry) {
    this.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // Trim whitespace from name, companyName, email
  if (this.name) this.name = this.name.trim();
  if (this.companyName) this.companyName = this.companyName.trim();
  if (this.email) this.email = this.email.trim();

  next();
});

// Instance method: Check if subscription is valid
tenantSchema.methods.isSubscriptionValid = function() {
  return this.isActive === true && this.subscriptionExpiry > new Date();
};

// Static method: Find active tenants
tenantSchema.statics.findActiveTenants = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Tenant', tenantSchema);