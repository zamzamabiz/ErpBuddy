const mongoose = require('mongoose');
const Tenant = require('../models/tenant.model');

/**
 * TENANT SERVICE
 * Complete CRUD operations with tenant isolation
 */

/**
 * Create a new tenant
 * @param {Object} tenantData - Tenant data
 * @returns {Promise<Object>} Created tenant
 */
const createTenant = async (tenantData) => {
  try {
    const tenant = new Tenant(tenantData);
    await tenant.save();
    return tenant;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Tenant with this email already exists');
    }
    throw error;
  }
};

/**
 * Get all tenants with optional filters
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Array>} List of tenants
 */
const getAllTenants = async (filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const query = {};

  // Apply filters
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.subscriptionPlan) {
    query.subscriptionPlan = filters.subscriptionPlan;
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { companyName: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder };

  const tenants = await Tenant.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Tenant.countDocuments(query);

  return {
    data: tenants,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get tenant by ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Tenant document
 */
const getTenantById = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  return tenant;
};

/**
 * Get tenant by email
 * @param {string} email - Tenant email
 * @returns {Promise<Object>} Tenant document
 */
const getTenantByEmail = async (email) => {
  const tenant = await Tenant.findOne({ email: email.toLowerCase() }).lean();
  return tenant;
};

/**
 * Update tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated tenant
 */
const updateTenant = async (tenantId, updateData) => {
  // Remove immutable fields from update
  const { _id, __v, ...allowedUpdates } = updateData;

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    allowedUpdates,
    { new: true, runValidators: true }
  );

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return tenant;
};

/**
 * Soft delete tenant (set isActive to false)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Deleted tenant
 */
const deleteTenant = async (tenantId) => {
  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { isActive: false },
    { new: true }
  );

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return tenant;
};

/**
 * Get active tenants only
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Array>} List of active tenants
 */
const getActiveTenants = async (options = {}) => {
  return getAllTenants({ isActive: true }, options);
};

/**
 * Check if tenant subscription is valid
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<boolean>} Subscription status
 */
const isSubscriptionValid = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  return tenant.isSubscriptionValid();
};

/**
 * Extend tenant subscription
 * @param {string} tenantId - Tenant ID
 * @param {number} days - Number of days to extend
 * @returns {Promise<Object>} Updated tenant
 */
const extendSubscription = async (tenantId, days) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentExpiry = tenant.subscriptionExpiry || new Date();
  const extension = days * 24 * 60 * 60 * 1000;
  tenant.subscriptionExpiry = new Date(currentExpiry.getTime() + extension);

  await tenant.save();
  return tenant;
};

/**
 * Tenant isolation middleware helper
 * Ensures user can only access their own tenant data
 * @param {string} userId - User ID
 * @param {string} requestedTenantId - Requested tenant ID
 * @returns {Promise<boolean>} Whether access is allowed
 */
const canAccessTenant = async (userId, requestedTenantId) => {
  // Admin users can access all tenants
  const User = mongoose.models.User || mongoose.model('User');
  const user = await User.findById(userId);

  if (!user) {
    return false;
  }

  if (user.role === 'admin' || user.userRole === 'admin') {
    return true;
  }

  // Regular users can only access their own tenant
  return user.tenantId && user.tenantId.toString() === requestedTenantId;
};

/**
 * Get tenant with isolation check
 * @param {string} tenantId - Tenant ID to retrieve
 * @param {string} requestingUserId - User making the request
 * @returns {Promise<Object>} Tenant document
 */
const getTenantWithIsolation = async (tenantId, requestingUserId) => {
  const canAccess = await canAccessTenant(requestingUserId, tenantId);

  if (!canAccess) {
    throw new Error('Access denied: You do not have permission to access this tenant');
  }

  return getTenantById(tenantId);
};

/**
 * Count total tenants
 * @param {Object} filters - Optional filters
 * @returns {Promise<number>} Total count
 */
const countTenants = async (filters = {}) => {
  return Tenant.countDocuments(filters);
};

module.exports = {
  createTenant,
  getAllTenants,
  getTenantById,
  getTenantByEmail,
  updateTenant,
  deleteTenant,
  getActiveTenants,
  isSubscriptionValid,
  extendSubscription,
  canAccessTenant,
  getTenantWithIsolation,
  countTenants
};