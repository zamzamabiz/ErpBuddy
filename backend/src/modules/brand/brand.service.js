const Brand = require('./brand.model');

class BrandService {
  /**
   * Create a new brand
   */
  async createBrand(data, tenantId) {
    try {
      // Validate required fields
      if (!data.name || !data.name.trim()) {
        throw new Error('Brand name is required');
      }

      // Check for duplicate brand name within tenant
      const existingBrand = await Brand.findOne({
        name: data.name.trim(),
        tenantId,
        deletedAt: null,
      });

      if (existingBrand) {
        throw new Error('A brand with that name already exists. Please use another name.');
      }

      // Validate brandType enum if provided
      if (data.brandType && !['LOCAL', 'IMPORTED', 'PREMIUM'].includes(data.brandType)) {
        throw new Error('Invalid brand type. Must be LOCAL, IMPORTED, or PREMIUM.');
      }

      const brand = new Brand({
        name: data.name.trim(),
        manufacturer: data.manufacturer ? data.manufacturer.trim() : null,
        brandType: data.brandType || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        tenantId,
      });

      return await brand.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all brands for a tenant
   */
  async getAllBrands(tenantId) {
    try {
      return await Brand.find({
        tenantId,
        deletedAt: null,
      })
        .lean()
        .exec();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a brand by ID
   */
  async getBrandById(id, tenantId) {
    try {
      const brand = await Brand.findOne({
        _id: id,
        tenantId,
        deletedAt: null,
      }).lean();

      if (!brand) {
        throw new Error('Brand not found');
      }

      return brand;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BrandService();
