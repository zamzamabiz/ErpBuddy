const Item = require('./item.model');
const Category = require('../category/category.model');
const Brand = require('../brand/brand.model');

class ItemService {
  /**
   * Validate Category exists and belongs to tenant
   */
  async validateCategory(categoryId, tenantId) {
    try {
      const category = await Category.findOne({
        _id: categoryId,
        tenantId,
        deletedAt: null,
      });

      if (!category) {
        throw new Error('Invalid category or category does not belong to this tenant');
      }

      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate Brand exists and belongs to tenant
   */
  async validateBrand(brandId, tenantId) {
    try {
      if (!brandId) return null; // Brand is optional

      const brand = await Brand.findOne({
        _id: brandId,
        tenantId,
        deletedAt: null,
      });

      if (!brand) {
        throw new Error('Invalid brand or brand does not belong to this tenant');
      }

      return brand;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async createItem(data, tenantId) {
    try {
      // Validate required fields
      if (!data.name || !data.name.trim()) {
        throw new Error('Item name is required');
      }

      if (!data.unit) {
        throw new Error('Unit is required');
      }

      if (!data.categoryId) {
        throw new Error('Category ID is required');
      }

      // Validate category exists and belongs to tenant
      await this.validateCategory(data.categoryId, tenantId);

      // Validate brand if provided
      if (data.brandId) {
        await this.validateBrand(data.brandId, tenantId);
      }

      // Check for duplicate item name within tenant
      const existingItemByName = await Item.findOne({
        name: data.name.trim(),
        tenantId,
        deletedAt: null,
      });

      if (existingItemByName) {
        throw new Error('An item with that name already exists. Please use another name.');
      }

      // Check for duplicate SKU if provided
      if (data.sku && data.sku.trim()) {
        const existingItemBySku = await Item.findOne({
          sku: data.sku.trim(),
          tenantId,
          deletedAt: null,
        });

        if (existingItemBySku) {
          throw new Error('An item with that SKU already exists. Please use another SKU.');
        }
      }

      const item = new Item({
        name: data.name.trim(),
        sku: data.sku ? data.sku.trim() : null,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        unit: data.unit,
        isBatchEnabled: data.isBatchEnabled !== undefined ? data.isBatchEnabled : false,
        isSerialEnabled: data.isSerialEnabled !== undefined ? data.isSerialEnabled : false,
        purchasePrice: data.purchasePrice || 0,
        salePrice: data.salePrice || 0,
        taxType: data.taxType || null,
        attributes: data.attributes || {},
        isActive: data.isActive !== undefined ? data.isActive : true,
        tenantId,
      });

      return await item.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all items for a tenant
   */
  async getAllItems(tenantId) {
    try {
      return await Item.find({
        tenantId,
        deletedAt: null,
      })
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .lean()
        .exec();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get an item by ID
   */
  async getItemById(id, tenantId) {
    try {
      const item = await Item.findOne({
        _id: id,
        tenantId,
        deletedAt: null,
      })
        .populate('categoryId')
        .populate('brandId')
        .lean();

      if (!item) {
        throw new Error('Item not found');
      }

      return item;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ItemService();
