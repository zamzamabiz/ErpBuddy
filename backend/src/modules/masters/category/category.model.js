const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound unique index: Category name must be unique per tenant (excluding soft-deleted)
CategorySchema.index(
  { tenantId: 1, name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// Index for active categories
CategorySchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('Category', CategorySchema);
