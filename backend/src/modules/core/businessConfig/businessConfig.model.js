const mongoose = require('mongoose');

/**
 * BUSINESS CONFIGURATION MODEL
 * Stores tenant-specific business settings and module preferences
 * 
 * Enables multi-industry SaaS support:
 * - Rice Trading (default)
 * - General Trading
 * - Manufacturing
 */

const businessConfigSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true,
    index: true
  },

  // Business type determines default modules and workflows
  businessType: {
    type: String,
    enum: ['rice_trading', 'general_trading', 'manufacturing', 'services'],
    default: 'rice_trading',
    required: true
  },

  // Human-readable business name
  businessName: {
    type: String,
    required: true
  },

  // Module configuration - which modules are enabled
  enabledModules: {
    // Core modules (always enabled)
    accounting: { type: Boolean, default: true },
    inventory: { type: Boolean, default: true },
    purchases: { type: Boolean, default: true },
    sales: { type: Boolean, default: true },
    expenses: { type: Boolean, default: true },

    // Industry-specific modules
    riceMilling: { type: Boolean, default: false },
    riceProfitEngine: { type: Boolean, default: false },
    manufacturing: { type: Boolean, default: false },
    qualityControl: { type: Boolean, default: false },

    // Optional modules
    advancedReports: { type: Boolean, default: false },
    multiWarehouse: { type: Boolean, default: false },
    batchTracking: { type: Boolean, default: false },
    barcodeSupport: { type: Boolean, default: false }
  },

  // Industry-specific settings
  industrySettings: {
    // Rice trading settings
    rice: {
      defaultMillingYield: { type: Number, default: 0.70 }, // 70% rice yield
      byproductHandling: { type: String, enum: ['track', 'ignore'], default: 'track' },
      qualityGrading: { type: Boolean, default: true }
    },

    // General trading settings
    trading: {
      defaultMarkup: { type: Number, default: 0.20 }, // 20% markup
      autoReorder: { type: Boolean, default: false },
      minStockAlert: { type: Number, default: 10 }
    },

    // Manufacturing settings
    manufacturing: {
      productionPlanning: { type: Boolean, default: false },
      billOfMaterials: { type: Boolean, default: false },
      workOrderTracking: { type: Boolean, default: false }
    }
  },

  // Default accounts for quick setup
  defaultAccounts: {
    salesAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    purchaseAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    expenseAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    inventoryAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    cashAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    }
  },

  // UI preferences
  uiPreferences: {
    currency: { type: String, default: 'PKR' },
    dateFormat: { type: String, enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], default: 'DD/MM/YYYY' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Karachi' }
  },

  // Audit fields
  isActive: {
    type: Boolean,
    default: true
  },

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
businessConfigSchema.index({ tenantId: 1, businessType: 1 });

// Pre-save middleware to set rice-specific defaults
businessConfigSchema.pre('save', function(next) {
  if (this.businessType === 'rice_trading' && !this.isModified('enabledModules')) {
    this.enabledModules.riceMilling = true;
    this.enabledModules.riceProfitEngine = true;
  }
  next();
});

// Instance method to check if module is enabled
businessConfigSchema.methods.isModuleEnabled = function(moduleName) {
  return this.enabledModules[moduleName] === true;
};

// Instance method to get available modules for business type
businessConfigSchema.methods.getAvailableModules = function() {
  const moduleMap = {
    rice_trading: ['riceMilling', 'riceProfitEngine', 'qualityControl'],
    general_trading: ['batchTracking', 'barcodeSupport', 'multiWarehouse'],
    manufacturing: ['manufacturing', 'qualityControl', 'batchTracking'],
    services: ['advancedReports']
  };

  return moduleMap[this.businessType] || [];
};

// Static method to get config by tenant
businessConfigSchema.statics.getConfigByTenant = async function(tenantId) {
  let config = await this.findOne({ tenantId });
  
  if (!config) {
    // Create default config for new tenant
    config = await this.create({
      tenantId,
      businessType: 'rice_trading',
      businessName: 'New Business',
      enabledModules: {
        accounting: true,
        inventory: true,
        purchases: true,
        sales: true,
        expenses: true,
        riceMilling: true,
        riceProfitEngine: true
      }
    });
  }
  
  return config;
};

module.exports = mongoose.model('BusinessConfig', businessConfigSchema);