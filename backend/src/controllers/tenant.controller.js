const Tenant = require('../models/tenant.model');

/**
 * Create a new tenant
 * POST /api/tenants
 */
const createTenant = async (req, res) => {
  try {
    const { name, companyName, email, phone, address, taxId, createdBy } = req.body;

    const tenant = new Tenant({
      name,
      companyName,
      email,
      phone,
      address,
      taxId,
      createdBy
    });

    await tenant.save();

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message
    });
  }
};

/**
 * Get all tenants (exclude soft-deleted)
 * GET /api/tenants
 */
const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ isActive: true })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Tenants retrieved successfully',
      data: tenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tenants',
      error: error.message
    });
  }
};

/**
 * Get tenant by ID
 * GET /api/tenants/:id
 */
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id)
      .populate('createdBy', 'name email');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tenant retrieved successfully',
      data: tenant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tenant',
      error: error.message
    });
  }
};

/**
 * Update tenant by ID
 * PUT /api/tenants/:id
 */
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message
    });
  }
};

/**
 * Soft delete tenant (set isActive: false)
 * DELETE /api/tenants/:id
 */
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully',
      data: tenant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: error.message
    });
  }
};

/**
 * Get active tenants using static method
 * GET /api/tenants/active/list
 */
const getActiveTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findActiveTenants()
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Active tenants retrieved successfully',
      data: tenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active tenants',
      error: error.message
    });
  }
};

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getActiveTenants
};