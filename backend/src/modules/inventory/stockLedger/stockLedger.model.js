const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true,
  },

  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  },

  // 🔴 Movement Type
  transactionType: {
    type: String,
    enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER'],
    required: true,
  },

  // 🔴 Reference
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },

  referenceType: {
    type: String,
  },

  // 🔴 Quantity Movement
  qtyIn: {
    type: Number,
    default: 0,
  },

  qtyOut: {
    type: Number,
    default: 0,
  },

  balanceQty: {
    type: Number,
    default: 0,
  },

  // 🔴 Cost Tracking
  unitCost: {
    type: Number,
    default: 0,
  },

  totalCost: {
    type: Number,
    default: 0,
  },

  // 🔴 Batch / SubLot (future ready)
  batchNo: {
    type: String,
  },

  subLot: {
    type: String,
  },

  // 🔴 Date
  transactionDate: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
