const mongoose = require('mongoose');

/**
 * 🏢 TENANT MODEL
 * 
 * Represents a company/organization in the multi-tenant SaaS system.
 * Each tenant has isolated data and separate database collections.
 * 
 * This is the FOUNDATION for multi-tenant architecture.
 */

const TenantSchema = new mongoose.Schema(
  {
    /**
     * Tenant company name
     * Must be unique and trimmed
     */
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
      minlength: [3, 'Tenant name must be at least 3 characters'],
      maxlength: [255, 'Tenant name cannot exceed 255 characters'],
      unique: true,
      sparse: true, // Allow null values to be unique
    },

    /**
     * Industry type for the tenant
     * Determines business rules and modules
     * RICE = Rice trading/milling
     * GENERAL = General trading/business
     */
    industryType: {
      type: String,
      enum: {
        values: ['RICE', 'GENERAL'],
        message: 'Industry type must be either RICE or GENERAL',
      },
      required: [true, 'Industry type is required'],
    },

    /**
     * Active status of the tenant
     * Inactive tenants cannot log in or access system
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Soft delete flag
     * Deleted tenants are not shown in queries
     */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    /**
     * Enable timestamps: createdAt and updatedAt
     * Auto-managed by Mongoose
     */
    timestamps: true,

    /**
     * MongoDB collection name
     */
    collection: 'tenants',
  }
);

/**
 * 🔍 Indexes
 * - name: Unique index for fast lookup and duplicate prevention
 * - createdAt: For sorting and time-based queries
 * - isActive + deletedAt: Composite for active tenant queries
 */
TenantSchema.index({ name: 1 }, { unique: true, sparse: true });
TenantSchema.index({ createdAt: -1 });
TenantSchema.index({ isActive: 1, deletedAt: 1 });

/**
 * 🔐 QUERY SCOPE
 * By default, queries exclude soft-deleted tenants
 * Use find() with { deletedAt: null } or call includeDeleted() explicitly
 */
TenantSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

/**
 * 📝 VIRTUAL FIELDS
 * statusDisplay: Human-readable status
 */
TenantSchema.virtual('statusDisplay').get(function () {
  return this.isActive ? 'Active' : 'Inactive';
});

/**
 * Ensure virtuals are included in JSON output
 */
TenantSchema.set('toJSON', { virtuals: true });

/**
 * ✅ HANDLE MODEL OVERWRITE
 * 
 * If model already exists (from old core/tenants), use existing.
 * Otherwise, create new one.
 * This prevents Mongoose OverwriteModelError.
 */
let TenantModel;
try {
  TenantModel = mongoose.model('Tenant');
} catch (err) {
  if (err.name === 'OverwriteModelError' || err.name === 'MissingSchemaError') {
    TenantModel = mongoose.model('Tenant', TenantSchema);
  } else {
    throw err;
  }
}

module.exports = TenantModel;
