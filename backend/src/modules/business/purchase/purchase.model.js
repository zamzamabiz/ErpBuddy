const mongoose = require('mongoose');

/**
 * PURCHASE MODEL - Multi-tenant purchase tracking
 * Includes proper tenant isolation and audit trail
 */
const purchaseSchema = new mongoose.Schema({
  // Multi-tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Purchase details
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  reference: {
    type: String,
    trim: true
  },

  // Items with enhanced tracking
  items: [{
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item', 
      required: true 
    },
    itemName: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    rate: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    costPrice: {
      type: Number,
      min: 0
    }
  }],

  // Financial details
  charges: { 
    type: Array, 
    default: [] 
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },

  // Company association
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' 
  },

  // Status tracking
  status: {
    type: String,
    enum: ['DRAFT', 'POSTED', 'CANCELLED'],
    default: 'DRAFT'
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
purchaseSchema.index({ tenantId: 1, supplierId: 1, deletedAt: 1 });
purchaseSchema.index({ tenantId: 1, date: -1, deletedAt: 1 });
purchaseSchema.index({ tenantId: 1, status: 1, deletedAt: 1 });
purchaseSchema.index({ tenantId: 1, companyId: 1, deletedAt: 1 });

// Static method to find purchases by tenant
purchaseSchema.statics.findByTenant = function(tenantId, companyId = null) {
  const query = { tenantId, deletedAt: null };
  if (companyId) query.companyId = companyId;
  return this.find(query).sort({ date: -1, createdAt: -1 });
};

// Static method to find purchase by ID and tenant
purchaseSchema.statics.findByTenantAndId = function(tenantId, purchaseId) {
  return this.findOne({ 
    _id: purchaseId, 
    tenantId, 
    deletedAt: null 
  });
};

module.exports = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

