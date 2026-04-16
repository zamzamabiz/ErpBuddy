const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    unit: {
      type: String,
      enum: ['KG', 'BAG', 'PCS', 'LITER', 'METER', 'BOX'],
      required: [true, 'Unit is required'],
    },
    isBatchEnabled: {
      type: Boolean,
      default: false,
    },
    isSerialEnabled: {
      type: Boolean,
      default: false,
    },
        purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxType: {
      type: String,
      default: null,
    },
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
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
    collection: 'items',
  }
);

// Unique index on name per tenant (excluding soft-deleted records)
itemSchema.index(
  { name: 1, tenantId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

// Unique index on SKU per tenant (excluding soft-deleted records)
itemSchema.index(
  { sku: 1, tenantId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { deletedAt: null, sku: { $ne: null } },
  }
);

// Performance indexes
itemSchema.index({ categoryId: 1, tenantId: 1 });
itemSchema.index({ brandId: 1, tenantId: 1 });
itemSchema.index({ isActive: 1, tenantId: 1 });

// Prevent model overwrite
let Item;
try {
  Item = mongoose.model('Item');
} catch {
  Item = mongoose.model('Item', itemSchema);
}

module.exports = Item;
