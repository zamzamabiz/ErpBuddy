const Item = require('./item.model');
const CategoryService = require('../category/category.service');
const SubCategoryService = require('../subcategory/subcategory.service');

class ItemService {
  /**
   * Create a new item
   */
  async createItem(tenantId, payload) {
    try {
      // Validate that category exists
      await CategoryService.getCategoryById(tenantId, payload.categoryId);

      // Validate that sub-category exists and belongs to correct category
      const subCategory = await SubCategoryService.getSubCategoryById(tenantId, payload.subCategoryId);
      
      if (subCategory.categoryId._id.toString() !== payload.categoryId) {
        throw new Error('SubCategory does not belong to the specified Category');
      }

      // Check if item with same SKU already exists for this tenant
      const existingItem = await Item.findOne({
        tenantId,
        sku: payload.sku,
        deletedAt: null
      });

      if (existingItem) {
        throw new Error(`Item with SKU "${payload.sku}" already exists for this tenant`);
      }

      const item = await Item.create({
        tenantId,
        name: payload.name,
        sku: payload.sku,
        categoryId: payload.categoryId,
        subCategoryId: payload.subCategoryId,
        unit: payload.unit || 'UNIT',
        itemType: payload.itemType || 'STOCK',
        isBatchTracked: payload.isBatchTracked || false,
        costingMethod: payload.costingMethod || 'FIFO',
        defaultWarehouseId: payload.defaultWarehouseId || null,
        purchasePrice: payload.purchasePrice || 0,
        salesPrice: payload.salesPrice || 0,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        description: payload.description || '',
        createdBy: payload.userId
      });

      // Populate references
      await item.populate([
        { path: 'categoryId', select: 'name code' },
        { path: 'subCategoryId', select: 'name code' }
      ]);

      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all items for a tenant
   */
  async getItems(tenantId, filters = {}) {
    try {
      const query = {
        tenantId,
        deletedAt: null
      };

      if (filters.categoryId) {
        query.categoryId = filters.categoryId;
      }

      if (filters.subCategoryId) {
        query.subCategoryId = filters.subCategoryId;
      }

      if (filters.itemType) {
        query.itemType = filters.itemType;
      }

      if (filters.costingMethod) {
        query.costingMethod = filters.costingMethod;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const items = await Item.find(query)
        .populate('categoryId', 'name code')
        .populate('subCategoryId', 'name code')
        .populate('defaultWarehouseId', 'name code')
        .select('-deletedAt')
        .sort({ createdAt: -1 });

      return items;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single item by ID
   */
  async getItemById(tenantId, itemId) {
    try {
      const item = await Item.findOne({
        _id: itemId,
        tenantId,
        deletedAt: null
      })
        .populate('categoryId')
        .populate('subCategoryId')
        .populate('defaultWarehouseId')
        .select('-deletedAt');

      if (!item) {
        throw new Error('Item not found');
      }

      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get item by SKU
   */
  async getItemBySku(tenantId, sku) {
    try {
      const item = await Item.findOne({
        tenantId,
        sku,
        deletedAt: null
      })
        .populate('categoryId')
        .populate('subCategoryId')
        .populate('defaultWarehouseId')
        .select('-deletedAt');

      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update item
   */
  async updateItem(tenantId, itemId, payload) {
    try {
      const item = await this.getItemById(tenantId, itemId);

      // If category is being changed, validate it exists
      if (payload.categoryId && payload.categoryId !== item.categoryId._id.toString()) {
        await CategoryService.getCategoryById(tenantId, payload.categoryId);
      }

      // If subcategory is being changed, validate it exists and belongs to correct category
      if (payload.subCategoryId) {
        const subCategory = await SubCategoryService.getSubCategoryById(tenantId, payload.subCategoryId);
        const categoryId = payload.categoryId || item.categoryId._id.toString();
        
        if (subCategory.categoryId._id.toString() !== categoryId) {
          throw new Error('SubCategory does not belong to the specified Category');
        }
      }

      // Check for duplicate SKU if SKU is being updated
      if (payload.sku && payload.sku !== item.sku) {
        const existingItem = await Item.findOne({
          tenantId,
          sku: payload.sku,
          _id: { $ne: itemId },
          deletedAt: null
        });

        if (existingItem) {
          throw new Error(`Item with SKU "${payload.sku}" already exists for this tenant`);
        }
      }

      Object.assign(item, {
        name: payload.name || item.name,
        sku: payload.sku || item.sku,
        categoryId: payload.categoryId || item.categoryId,
        subCategoryId: payload.subCategoryId || item.subCategoryId,
        unit: payload.unit || item.unit,
        itemType: payload.itemType || item.itemType,
        isBatchTracked: payload.isBatchTracked !== undefined ? payload.isBatchTracked : item.isBatchTracked,
        costingMethod: payload.costingMethod || item.costingMethod,
        defaultWarehouseId: payload.defaultWarehouseId || item.defaultWarehouseId,
        purchasePrice: payload.purchasePrice !== undefined ? payload.purchasePrice : item.purchasePrice,
        salesPrice: payload.salesPrice !== undefined ? payload.salesPrice : item.salesPrice,
        isActive: payload.isActive !== undefined ? payload.isActive : item.isActive,
        description: payload.description !== undefined ? payload.description : item.description,
        updatedBy: payload.userId
      });

      await item.save();
      await item.populate([
        { path: 'categoryId', select: 'name code' },
        { path: 'subCategoryId', select: 'name code' }
      ]);
      
      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete item
   */
  async deleteItem(tenantId, itemId) {
    try {
      const item = await this.getItemById(tenantId, itemId);

      item.deletedAt = new Date();
      await item.save();
      
      return { message: 'Item deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if items exist
   */
  async itemsExist(tenantId, itemIds) {
    try {
      const count = await Item.countDocuments({
        _id: { $in: itemIds },
        tenantId,
        deletedAt: null
      });

      return count === itemIds.length;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get items by category
   */
  async getItemsByCategory(tenantId, categoryId) {
    try {
      const items = await Item.find({
        tenantId,
        categoryId,
        deletedAt: null,
        isActive: true
      })
        .populate('subCategoryId', 'name code')
        .select('-deletedAt');

      return items;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get items by sub-category
   */
  async getItemsBySubCategory(tenantId, subCategoryId) {
    try {
      const items = await Item.find({
        tenantId,
        subCategoryId,
        deletedAt: null,
        isActive: true
      })
        .populate('categoryId', 'name code')
        .select('-deletedAt');

      return items;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ItemService();
