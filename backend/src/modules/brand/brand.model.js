const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: null,
    },
    brandType: {
      type: String,
      enum: ['LOCAL', 'IMPORTED', 'PREMIUM'],
      default: null,
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
    collection: 'brands',
  }
);

// Unique index on name per tenant (excluding soft-deleted records)
brandSchema.index(
  { name: 1, tenantId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

// Prevent model overwrite
let Brand;
try {
  Brand = mongoose.model('Brand');
} catch {
  Brand = mongoose.model('Brand', brandSchema);
}

module.exports = Brand;
