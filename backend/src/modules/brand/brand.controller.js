const brandService = require('./brand.service');

class BrandController {
  /**
   * Create a new brand
   * POST /api/brands
   */
  async createBrand(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'x-tenant-id header is missing',
        });
      }

      const { name, manufacturer, brandType, isActive } = req.body;

      const brand = await brandService.createBrand(
        {
          name,
          manufacturer,
          brandType,
          isActive,
        },
        tenantId
      );

      return res.status(201).json({
        success: true,
        message: 'Brand created successfully',
        data: brand,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        message: 'Failed to create brand',
      });
    }
  }

  /**
   * Get all brands
   * GET /api/brands
   */
  async getCategories(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'x-tenant-id header is missing',
        });
      }

      const brands = await brandService.getAllBrands(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Brands retrieved successfully',
        data: brands,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: 'Failed to retrieve brands',
      });
    }
  }

  /**
   * Get a brand by ID
   * GET /api/brands/:id
   */
  async getBrand(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'x-tenant-id header is missing',
        });
      }

      const { id } = req.params;

      const brand = await brandService.getBrandById(id, tenantId);

      return res.status(200).json({
        success: true,
        message: 'Brand retrieved successfully',
        data: brand,
      });
    } catch (error) {
      if (error.message === 'Brand not found') {
        return res.status(404).json({
          error: error.message,
          message: 'Brand not found',
        });
      }

      return res.status(500).json({
        error: error.message,
        message: 'Failed to retrieve brand',
      });
    }
  }
}

module.exports = new BrandController();
