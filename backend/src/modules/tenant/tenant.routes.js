const express = require('express');
const router = express.Router();
const tenantController = require('./tenant.controller');

/**
 * 🏢 TENANT ROUTES
 * 
 * Base route: /api/tenants
 * 
 * Currently NO authentication middleware (for setup phase).
 * In next phase: Add auth + permission checks.
 * 
 * Routes:
 * POST   /        → Create tenant
 * GET    /        → Get all tenants
 * GET    /:id     → Get tenant by ID
 */

/**
 * POST /api/tenants
 * Create a new tenant
 */
router.post('/', tenantController.createTenant.bind(tenantController));

/**
 * GET /api/tenants
 * Get all active tenants
 */
router.get('/', tenantController.getTenants.bind(tenantController));

/**
 * GET /api/tenants/:id
 * Get tenant by ID
 */
router.get('/:id', tenantController.getTenant.bind(tenantController));

module.exports = router;
