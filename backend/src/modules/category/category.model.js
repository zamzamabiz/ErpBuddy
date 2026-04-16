const mongoose = require('mongoose');

/**
 * 🌳 CATEGORY MODEL
 * 
 * Hierarchical category structure with tree support:
 * - Root categories (parentId = null)
 * - Child categories (parentId = ObjectId)
 * - Max depth = 4 levels
 * 
 * Multi-tenant isolated (tenantId required on ALL queries)
 */

const CategorySchema = new mongoose.Schema(
  {
    /**
     * Category name (must be unique per parent + tenant)
     */
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    /**
     * Parent category reference
     * null = root category
     * ObjectId = child category
     */
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    /**
     * Hierarchy level (auto-calculated)
     * 1 = root
     * 2 = child of root
     * 3 = grandchild
     * 4 = great-grandchild (max)
     */
    level: {
      type: Number,
      required: true,
      enum: {
        values: [1, 2, 3, 4],
        message: 'Category level must be between 1 and 4',
      },
    },

    /**
     * Active status
     * Inactive categories cannot be used
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Multi-tenant isolation (REQUIRED)
     * Every category belongs to exactly one tenant
     */
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
    },

    /**
     * Soft delete flag
     */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'categories',
  }
);

/**
 * 🔍 INDEXES
 * - Compound index for tenant + parent (fast tree traversal)
 * - Compound index for soft delete queries
 * - Unique index for duplicate prevention
 */
CategorySchema.index({ tenantId: 1, parentId: 1, deletedAt: 1 });
CategorySchema.index({ tenantId: 1, name: 1, parentId: 1, deletedAt: 1 }, { unique: true, sparse: true });
CategorySchema.index({ createdAt: -1 });

/**
 * 🔐 VIRTUAL - Parent Category (populated on demand)
 * Note: Used mainly for API responses, not stored in DB
 */
CategorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});

/**
 * 🔐 VIRTUAL - Child Categories
 */
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false,
});

CategorySchema.set('toJSON', { virtuals: true });

/**
 * 📝 HELPER METHODS
 */

/**
 * Is this a root category?
 */
CategorySchema.methods.isRoot = function () {
  return this.parentId === null;
};

/**
 * Get path from root to this category
 */
CategorySchema.methods.getPath = async function () {
  const path = [this._id];
  let current = this;

  while (current.parentId) {
    current = await current.constructor.findById(current.parentId);
    if (!current) break;
    path.unshift(current._id);
  }

  return path;
};

/**
 * Get breadcrumb: [Root, Parent, Child]
 */
CategorySchema.methods.getBreadcrumb = async function () {
  const path = await this.getPath();
  return this.constructor.find({ _id: { $in: path } }).select('name').sort({ level: 1 }).lean();
};

/**
 * Handle model registration (prevent overwrite)
 */
let CategoryModel;
try {
  CategoryModel = mongoose.model('Category');
} catch (err) {
  if (err.name === 'OverwriteModelError' || err.name === 'MissingSchemaError') {
    CategoryModel = mongoose.model('Category', CategorySchema);
  } else {
    throw err;
  }
}

module.exports = CategoryModel;
