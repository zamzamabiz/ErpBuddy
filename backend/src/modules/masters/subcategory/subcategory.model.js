const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'SubCategory name is required'],
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

// Compound unique index: SubCategory name must be unique per category per tenant (excluding soft-deleted)
SubCategorySchema.index(
  { tenantId: 1, categoryId: 1, name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// Index for active sub-categories
SubCategorySchema.index({ tenantId: 1, categoryId: 1, isActive: 1 });

module.exports = mongoose.model('SubCategory', SubCategorySchema);
