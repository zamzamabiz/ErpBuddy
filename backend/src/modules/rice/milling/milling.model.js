const mongoose = require('mongoose');

/**
 * MILLING MODEL
 * Records paddy to rice conversion (milling process)
 * Tracks input (paddy) and outputs (rice, broken, husk) with cost allocation
 */
const millingSchema = new mongoose.Schema({
  // Multi-tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Milling batch identifier
  batchNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Input: Paddy details
  input: {
    paddyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be positive']
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    },
    godownId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    }
  },

  // Processing cost (labor, electricity, etc.)
  processingCost: {
    type: Number,
    default: 0,
    min: 0
  },

  // Total cost (input cost + processing)
  totalProcessingCost: {
    type: Number,
    required: true
  },

  // Output: Rice and byproducts
  outputs: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
      },
      itemType: {
        type: String,
        enum: ['rice', 'broken', 'husk'],
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      allocatedCost: {
        type: Number,
        required: true,
        min: 0
      },
      unitCost: {
        type: Number,
        required: true,
        min: 0
      },
      ratio: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      godownId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
      }
    }
  ],

  // Milling date
  millingDate: {
    type: Date,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },

  // References to related documents
  references: {
    stockMovementIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockMovement'
    }],
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journal'
    }
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'rice_milling',
  timestamps: true
});

// Indexes for efficient querying
millingSchema.index({ tenantId: 1, status: 1, millingDate: -1 });
millingSchema.index({ tenantId: 1, batchNumber: 1 });
millingSchema.index({ tenantId: 1, 'input.paddyItemId': 1 });
millingSchema.index({ tenantId: 1, 'outputs.itemId': 1 });

// Pre-save hook to calculate total processing cost
millingSchema.pre('save', function(next) {
  if (this.isModified('input.totalCost') || this.isModified('processingCost')) {
    this.totalProcessingCost = this.input.totalCost + this.processingCost;
  }
  next();
});

// Instance method to check if milling is complete
millingSchema.methods.isComplete = function() {
  return this.status === 'completed';
};

// Static method to generate batch number
millingSchema.statics.generateBatchNumber = async function() {
  const count = await this.countDocuments();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `MILL-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Milling', millingSchema);