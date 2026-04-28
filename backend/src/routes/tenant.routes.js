const express = require('express');
const router = express.Router();
const tenantService = require('../services/tenant.service');

/**
 * TENANT ROUTES
 * Complete CRUD operations for tenant management
 */

/**
 * POST /api/tenants
 * Create a new tenant
 * Body: { name, companyName, email, phone?, address?, taxId? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, companyName, email, phone, address, taxId } = req.body;

    // Validate required fields
    if (!name || !companyName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name, companyName, and email are required'
      });
    }

    const tenantData = {
      name,
      companyName,
      email,
      phone,
      address,
      taxId,
      createdBy: req.user?._id || null
    };

    const tenant = await tenantService.createTenant(tenantData);

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tenants
 * Get all tenants (with optional filters)
 * Query params: page, limit, sortBy, sortOrder, isActive, subscriptionPlan, search
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = -1,
      isActive,
      subscriptionPlan,
      search
    } = req.query;

    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (subscriptionPlan) {
      filters.subscriptionPlan = subscriptionPlan;
    }
    if (search) {
      filters.search = search;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: parseInt(sortOrder)
    };

    const result = await tenantService.getAllTenants(filters, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Tenants retrieved successfully'
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tenants/active
 * Get all active tenants
 */
router.get('/active', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: parseInt(sortOrder)
    };

    const result = await tenantService.getActiveTenants(options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Active tenants retrieved successfully'
    });
  } catch (error) {
    console.error('Get active tenants error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tenants/:id
 * Get tenant by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Optional isolation check if user is authenticated
    if (req.user && req.user.role !== 'admin') {
      const tenant = await tenantService.getTenantWithIsolation(id, req.user._id);
      return res.json({
        success: true,
        data: tenant,
        message: 'Tenant retrieved successfully'
      });
    }

    const tenant = await tenantService.getTenantById(id);

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant retrieved successfully'
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    if (error.message === 'Tenant not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/tenants/:id
 * Update tenant
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Optional isolation check if user is authenticated
    if (req.user && req.user.role !== 'admin') {
      await tenantService.getTenantWithIsolation(id, req.user._id);
    }

    const tenant = await tenantService.updateTenant(id, updateData);

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    if (error.message === 'Tenant not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/tenants/:id
 * Soft delete tenant (set isActive to false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Optional isolation check if user is authenticated
    if (req.user && req.user.role !== 'admin') {
      await tenantService.getTenantWithIsolation(id, req.user._id);
    }

    const tenant = await tenantService.deleteTenant(id);

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    if (error.message === 'Tenant not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/tenants/:id/extend-subscription
 * Extend tenant subscription
 * Body: { days }
 */
router.post('/:id/extend-subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Days must be a positive number'
      });
    }

    const tenant = await tenantService.extendSubscription(id, days);

    res.json({
      success: true,
      data: tenant,
      message: `Subscription extended by ${days} days`
    });
  } catch (error) {
    console.error('Extend subscription error:', error);
    if (error.message === 'Tenant not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tenants/:id/subscription-status
 * Check if tenant subscription is valid
 */
router.get('/:id/subscription-status', async (req, res) => {
  try {
    const { id } = req.params;

    const isValid = await tenantService.isSubscriptionValid(id);
    const tenant = await tenantService.getTenantById(id);

    res.json({
      success: true,
      data: {
        tenantId: id,
        subscriptionPlan: tenant.subscriptionPlan,
        subscriptionExpiry: tenant.subscriptionExpiry,
        isValid
      },
      message: 'Subscription status retrieved successfully'
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    if (error.message === 'Tenant not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;