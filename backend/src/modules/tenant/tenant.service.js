const Tenant = require('./tenant.model');

/**
 * 🏢 TENANT SERVICE
 * 
 * Business logic for tenant operations.
 * Handles:
 * - Tenant creation (validation + persistence)
 * - Tenant retrieval
 * - Tenant queries
 * 
 * This service is TENANTLESS (no tenant filtering).
 * Only used by admin/super-admin during authentication & onboarding.
 */

class TenantService {
  /**
   * ✅ CREATE TENANT
   * 
   * Validates and creates a new tenant.
   * 
   * @param {Object} data - Tenant data
   * @param {string} data.name - Tenant company name
   * @param {string} data.industryType - Industry type (RICE | GENERAL)
   * @returns {Promise<Object>} Created tenant object
   * @throws {Error} If validation fails or duplicate name exists
   */
  async createTenant(data) {
    // 1️⃣ Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new Error('Tenant name is required');
    }

    if (!data.industryType) {
      throw new Error('Industry type is required');
    }

    if (!['RICE', 'GENERAL'].includes(data.industryType)) {
      throw new Error('Industry type must be either RICE or GENERAL');
    }

    // 2️⃣ Check for duplicate tenant name
    const existingTenant = await Tenant.findOne({ name: data.name.trim(), deletedAt: null });
    if (existingTenant) {
      throw new Error(`A tenant with name "${data.name}" already exists. Please use another name.`);
    }

    // 3️⃣ Create new tenant
    try {
      const tenant = new Tenant({
        name: data.name.trim(),
        industryType: data.industryType,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });

      await tenant.save();

      console.log(`✅ Tenant created: ${tenant.name} (${tenant._id})`);
      return tenant.toJSON();
    } catch (err) {
      console.error('❌ Tenant creation failed:', err.message);
      throw new Error(`Failed to create tenant: ${err.message}`);
    }
  }

  /**
   * ✅ GET ALL TENANTS
   * 
   * Retrieves all active (non-deleted) tenants.
   * 
   * @returns {Promise<Array>} Array of tenant objects
   */
  async getAllTenants() {
    try {
      const tenants = await Tenant.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();

      console.log(`✅ Retrieved ${tenants.length} active tenants`);
      return tenants;
    } catch (err) {
      console.error('❌ Failed to retrieve tenants:', err.message);
      throw new Error(`Failed to retrieve tenants: ${err.message}`);
    }
  }

  /**
   * ✅ GET TENANT BY ID
   * 
   * Retrieves a single tenant by ID.
   * Returns null if tenant not found or is deleted.
   * 
   * @param {string} tenantId - Tenant MongoDB ID
   * @returns {Promise<Object|null>} Tenant object or null
   */
  async getTenantById(tenantId) {
    try {
      // Validate ObjectId format
      if (!tenantId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid tenant ID format');
      }

      const tenant = await Tenant.findOne({ _id: tenantId, deletedAt: null }).lean();

      if (!tenant) {
        console.log(`⚠️ Tenant not found: ${tenantId}`);
        return null;
      }

      console.log(`✅ Tenant retrieved: ${tenant.name}`);
      return tenant;
    } catch (err) {
      console.error('❌ Failed to retrieve tenant:', err.message);
      throw new Error(`Failed to retrieve tenant: ${err.message}`);
    }
  }

  /**
   * ✅ GET TENANT BY NAME
   * 
   * Retrieves a tenant by exact name.
   * Used for verification during tenant setup.
   * 
   * @param {string} name - Tenant name
   * @returns {Promise<Object|null>} Tenant object or null
   */
  async getTenantByName(name) {
    try {
      if (!name || !name.trim()) {
        throw new Error('Tenant name is required');
      }

      const tenant = await Tenant.findOne({ name: name.trim(), deletedAt: null }).lean();

      if (!tenant) {
        console.log(`⚠️ Tenant not found: ${name}`);
        return null;
      }

      console.log(`✅ Tenant retrieved by name: ${tenant.name}`);
      return tenant;
    } catch (err) {
      console.error('❌ Failed to retrieve tenant by name:', err.message);
      throw new Error(`Failed to retrieve tenant: ${err.message}`);
    }
  }

  /**
   * ✅ UPDATE TENANT (FUTURE USE)
   * 
   * Placeholder for tenant update (soft update of active status, etc).
   * Will be implemented in next phase.
   * 
   * @param {string} tenantId - Tenant ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated tenant
   */
  async updateTenant(tenantId, data) {
    throw new Error('Tenant updates not yet implemented. Contact admin.');
  }

  /**
   * ✅ SOFT DELETE TENANT (FUTURE USE)
   * 
   * Marks tenant as deleted (sets deletedAt).
   * Data is preserved but tenant cannot log in.
   * 
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Deleted tenant
   */
  async deleteTenant(tenantId) {
    throw new Error('Tenant deletion not yet implemented. Contact admin.');
  }
}

module.exports = new TenantService();
