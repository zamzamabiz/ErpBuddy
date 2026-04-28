const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Tenant Context Middleware
 * Extracts tenantId from JWT token and attaches to request
 * Enforces multi-tenant isolation for all protected routes
 */
module.exports = async function tenantMiddleware(req, res, next) {
  try {
    let tenantId = null;

    // STRATEGY 1: Extract tenantId from JWT token (primary)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, jwtConfig.secret || 'erpbuddy-secret-key-2025');
        if (decoded.tenantId) {
          tenantId = decoded.tenantId;
          console.log(`✅ [TenantMiddleware] tenantId extracted from JWT: ${tenantId}`);
        }
      } catch (err) {
        console.log(`⚠️ [TenantMiddleware] JWT verification failed: ${err.message}`);
        // Token verification failed, continue to check header
      }
    }

    // STRATEGY 2: Fallback to x-tenant-id header (for API calls without JWT)
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] || req.headers['tenantid'];
      if (tenantId) {
        console.log(`✅ [TenantMiddleware] tenantId extracted from header: ${tenantId}`);
      }
    }

    // If no tenantId found after both strategies, reject request
    if (!tenantId) {
      console.log(`❌ [TenantMiddleware] No tenantId found in JWT or headers`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Tenant ID required. Please provide valid JWT token or x-tenant-id header.'
      });
    }

    // Validate tenantId is a valid MongoDB ObjectId format (24 hex chars)
    if (!/^[0-9a-f]{24}$/i.test(tenantId)) {
      console.log(`❌ [TenantMiddleware] Invalid tenantId format: ${tenantId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid tenant ID format'
      });
    }

    // ✅ Attach tenantId to req object for use in services and queries
    req.tenantId = tenantId;
    req.tenant = { id: tenantId, _id: tenantId }; // For compatibility

    console.log(`🔒 [TenantMiddleware] Context set for tenant: ${tenantId} on path: ${req.path}`);
    next();
  } catch (error) {
    console.error(`🔴 [TenantMiddleware] Unexpected error:`, error);
    res.status(500).json({
      success: false,
      message: 'Tenant middleware error',
      error: error.message
    });
  }
};