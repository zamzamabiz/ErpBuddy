const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
    },
    batchNo: {
      type: String,
      trim: true,
      default: null,
    },
    subLotNo: {
      type: String,
      trim: true,
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      enum: ['KG', 'BAG', 'PCS', 'LITER', 'METER', 'BOX'],
      required: [true, 'Unit is required'],
    },
    transactionType: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUST'],
      required: [true, 'Transaction type is required'],
    },
    referenceType: {
      type: String,
      enum: ['PURCHASE', 'SALE', 'OPENING', 'ADJUSTMENT', 'TRANSFER', 'DAMAGE', 'RETURN'],
      default: null,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'inventory',
  }
);

// Index for fast stock queries
inventorySchema.index({ itemId: 1, tenantId: 1 });
inventorySchema.index({ itemId: 1, tenantId: 1, batchNo: 1 });
inventorySchema.index({ tenantId: 1, date: -1 });

// Prevent model overwrite
let Inventory;
try {
  Inventory = mongoose.model('Inventory');
} catch {
  Inventory = mongoose.model('Inventory', inventorySchema);
}

module.exports = Inventory;
