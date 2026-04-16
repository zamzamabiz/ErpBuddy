const tenantService = require('./tenant.service');

/**
 * 🏢 TENANT CONTROLLER
 * 
 * HTTP request handlers for tenant operations.
 * 
 * Rules:
 * - Try/catch with proper error handling
 * - Consistent HTTP status codes
 * - Proper error messages
 * - No business logic (delegate to service)
 */

class TenantController {
  /**
   * ✅ POST /api/tenants
   * 
   * Create a new tenant.
   * 
   * Request body:
   * {
   *   "name": "ABC Rice Mills",
   *   "industryType": "RICE"
   * }
   * 
   * Response:
   * 201 Created
   * {
   *   "_id": "...",
   *   "name": "ABC Rice Mills",
   *   "industryType": "RICE",
   *   "isActive": true,
   *   "createdAt": "...",
   *   "updatedAt": "..."
   * }
   */
  async createTenant(req, res) {
    try {
      const { name, industryType, isActive } = req.body;

      // Delegate to service
      const tenant = await tenantService.createTenant({
        name,
        industryType,
        isActive,
      });

      // 201 Created
      return res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: tenant,
      });
    } catch (err) {
      console.error('❌ Create tenant error:', err.message);

      // 400 Bad Request (validation error)
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to create tenant',
      });
    }
  }

  /**
   * ✅ GET /api/tenants
   * 
   * Get all active tenants.
   * 
   * Response:
   * 200 OK
   * {
   *   "success": true,
   *   "message": "Tenants retrieved successfully",
   *   "data": [
   *     { "_id": "...", "name": "ABC Rice Mills", ... },
   *     { "_id": "...", "name": "XYZ Traders", ... }
   *   ]
   * }
   */
  async getTenants(req, res) {
    try {
      const tenants = await tenantService.getAllTenants();

      // 200 OK
      return res.status(200).json({
        success: true,
        message: 'Tenants retrieved successfully',
        data: tenants,
        count: tenants.length,
      });
    } catch (err) {
      console.error('❌ Get tenants error:', err.message);

      // 500 Server Error
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve tenants',
      });
    }
  }

  /**
   * ✅ GET /api/tenants/:id
   * 
   * Get a single tenant by ID.
   * 
   * Response:
   * 200 OK
   * {
   *   "success": true,
   *   "message": "Tenant retrieved successfully",
   *   "data": { "_id": "...", "name": "ABC Rice Mills", ... }
   * }
   * 
   * OR
   * 
   * 404 Not Found
   * {
   *   "success": false,
   *   "message": "Tenant not found"
   * }
   */
  async getTenant(req, res) {
    try {
      const { id } = req.params;

      // Delegate to service
      const tenant = await tenantService.getTenantById(id);

      // 404 Not Found
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // 200 OK
      return res.status(200).json({
        success: true,
        message: 'Tenant retrieved successfully',
        data: tenant,
      });
    } catch (err) {
      console.error('❌ Get tenant error:', err.message);

      // 400 Bad Request (invalid ID format, etc)
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to retrieve tenant',
      });
    }
  }
}

module.exports = new TenantController();
