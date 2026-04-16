const mongoose = require('mongoose');

/**
 * STOCK BALANCE MODEL
 * Real-time inventory tracking by item, warehouse, and batch
 * Used for stock availability checks and inventory reporting
 */
const stockBalanceSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true
    },

    // Item reference
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
      index: true
    },

    // Warehouse/Godown reference
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse ID is required'],
      index: true
    },

    // Batch/Lot tracking
    batchNo: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },

    // Current quantity on hand
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
      get: (val) => parseFloat(val.toFixed(4))
    },

    // Unit of measurement
    unit: {
      type: String,
      enum: ['KG', 'BAG', 'PCS', 'LITER', 'METER', 'BOX', 'UNIT'],
      required: [true, 'Unit is required'],
      default: 'UNIT'
    },

    // Cost tracking
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      default: 0,
      min: [0, 'Cost price cannot be negative'],
      get: (val) => parseFloat(val.toFixed(2))
    },

    // Total cost value (quantity × costPrice)
    totalCostValue: {
      type: Number,
      default: 0,
      get: (val) => parseFloat(val.toFixed(2))
    },

    // Reorder level for alerts
    reorderLevel: {
      type: Number,
      default: 0,
      min: [0, 'Reorder level cannot be negative']
    },

    // Maximum stock level
    maxStockLevel: {
      type: Number,
      default: 999999,
      min: [0, 'Max stock level cannot be negative']
    },

    // Last updated timestamp
    lastMovedAt: {
      type: Date,
      default: Date.now
    },

    // Status tracking
    status: {
      type: String,
      enum: ['ACTIVE', 'DISCONTINUED', 'SLOW_MOVING'],
      default: 'ACTIVE',
      index: true
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    getters: true,
    collection: 'stockBalance'
  }
);

// Compound index for fast stock lookups
stockBalanceSchema.index({ tenantId: 1, itemId: 1, warehouseId: 1, batchNo: 1 }, { unique: true, sparse: true });
stockBalanceSchema.index({ tenantId: 1, itemId: 1, warehouseId: 1 });
stockBalanceSchema.index({ tenantId: 1, status: 1, quantity: 1 });

// Auto-calculate total cost value before saving
stockBalanceSchema.pre('save', function(next) {
  if (this.quantity && this.costPrice) {
    this.totalCostValue = (this.quantity * this.costPrice).toFixed(2);
  }
  next();
});

// Prevent model overwrite
let StockBalance;
try {
  StockBalance = mongoose.model('StockBalance');
} catch {
  StockBalance = mongoose.model('StockBalance', stockBalanceSchema);
}

module.exports = StockBalance;
