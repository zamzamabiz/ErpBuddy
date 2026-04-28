/**
 * Tenant Context Helper
 * Ensures all queries are filtered by tenantId for multi-tenant isolation
 * Usage in services: const query = getTenantQuery(req.tenantId, { /* base query */ });
 */

/**
 * Create a query filter that includes tenantId
 * @param {string} tenantId - The tenant ID from request context
 * @param {Object} baseQuery - Optional base query to merge with tenantId filter
 * @returns {Object} Query filter object with tenantId included
 */
function getTenantQuery(tenantId, baseQuery = {}) {
  if (!tenantId) {
    throw new Error('❌ SECURITY: tenantId is required for database query. Request has no tenant context.');
  }

  return {
    ...baseQuery,
    tenantId: tenantId
  };
}

/**
 * Validate that a resource belongs to the tenant
 * @param {Object} resource - The resource from database
 * @param {string} tenantId - The tenant ID from request context
 * @returns {boolean} True if resource belongs to tenant
 */
function validateTenantAccess(resource, tenantId) {
  if (!resource) return false;
  if (!resource.tenantId) return false;
  return resource.tenantId.toString() === tenantId.toString();
}

/**
 * Extract tenant context from request
 * @param {Object} req - Express request object
 * @returns {string} The tenant ID
 */
function getTenantFromRequest(req) {
  if (!req.tenantId) {
    throw new Error('❌ SECURITY: Tenant middleware not applied. No tenantId in request.');
  }
  return req.tenantId;
}

module.exports = {
  getTenantQuery,
  validateTenantAccess,
  getTenantFromRequest
};
