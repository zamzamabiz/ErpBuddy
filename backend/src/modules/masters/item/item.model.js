const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
      index: true
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: [true, 'SubCategory ID is required'],
      index: true
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      default: 'UNIT'
    },
    itemType: {
      type: String,
      enum: ['STOCK', 'SERVICE'],
      required: [true, 'Item type is required'],
      default: 'STOCK'
    },
    // Inventory & Costing Configuration
    isBatchTracked: {
      type: Boolean,
      default: false
    },
    costingMethod: {
      type: String,
      enum: ['FIFO', 'LIFO'],
      default: 'FIFO'
    },
    defaultWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    // Pricing (Future-ready for reports)
    purchasePrice: {
      type: Number,
      default: 0
    },
    salesPrice: {
      type: Number,
      default: 0
    },
    // Costing (for inventory valuation & production orders)
    costPrice: {
      type: Number,
      default: 0
    },
    // Barcode & Identifiers
    barcode: {
      type: String,
      sparse: true
    },
    itemCode: {
      type: String,
      sparse: true,
      index: true
    },
    // Tax & Classification
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax'
    },
    // Inventory Controls
    reorderLevel: {
      type: Number,
      default: 0
    },
    minimumStock: {
      type: Number,
      default: 0
    },
    maximumStock: {
      type: Number,
      default: 0
    },
    openingStock: {
      type: Number,
      default: 0
    },
    openingStockValue: {
      type: Number,
      default: 0
    },
    // Additional Notes
    notes: {
      type: String,
      default: ''
    },
    // Company ID (for legacy transactions & multi-company support)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      sparse: true,
      index: true
    },
    // Status & Metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: SKU must be unique per tenant (excluding soft-deleted)
ItemSchema.index(
  { tenantId: 1, sku: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// Index for active items
ItemSchema.index({ tenantId: 1, isActive: 1 });

// Index for category + subcategory queries
ItemSchema.index({ tenantId: 1, categoryId: 1, subCategoryId: 1 });

// Index for costing method (useful for reports)
ItemSchema.index({ tenantId: 1, costingMethod: 1 });

// LEGACY: DO NOT REGISTER - Use new Item module at /modules/item/item.model.js
// This file is kept for backward compatibility but the actual Item model
// is registered and managed by the new Item module
let Item;
try {
  Item = mongoose.model('Item');
} catch {
  // Don't create a new model - let the new Item module handle registration
  // This prevents the OverwriteModelError when both modules try to register
  Item = null;
}

module.exports = Item || {};
