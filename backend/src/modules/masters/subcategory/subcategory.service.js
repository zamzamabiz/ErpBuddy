const SubCategory = require('./subcategory.model');
const CategoryService = require('../category/category.service');

class SubCategoryService {
  /**
   * Create a new sub-category
   */
  async createSubCategory(tenantId, payload) {
    try {
      // Validate that category exists
      await CategoryService.getCategoryById(tenantId, payload.categoryId);

      // Check if sub-category with same name already exists for this category
      const existingSubCategory = await SubCategory.findOne({
        tenantId,
        categoryId: payload.categoryId,
        name: payload.name,
        deletedAt: null
      });

      if (existingSubCategory) {
        throw new Error(`SubCategory "${payload.name}" already exists in this category`);
      }

      const subCategory = await SubCategory.create({
        tenantId,
        categoryId: payload.categoryId,
        name: payload.name,
        code: payload.code || '',
        description: payload.description || '',
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        createdBy: payload.userId
      });

      // Populate category reference
      await subCategory.populate('categoryId');

      return subCategory;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all sub-categories for a tenant or specific category
   */
  async getSubCategories(tenantId, filters = {}) {
    try {
      const query = {
        tenantId,
        deletedAt: null
      };

      if (filters.categoryId) {
        query.categoryId = filters.categoryId;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const subCategories = await SubCategory.find(query)
        .populate('categoryId', 'name code')
        .select('-deletedAt')
        .sort({ createdAt: -1 });

      return subCategories;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single sub-category by ID
   */
  async getSubCategoryById(tenantId, subCategoryId) {
    try {
      const subCategory = await SubCategory.findOne({
        _id: subCategoryId,
        tenantId,
        deletedAt: null
      })
        .populate('categoryId')
        .select('-deletedAt');

      if (!subCategory) {
        throw new Error('SubCategory not found');
      }

      return subCategory;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update sub-category
   */
  async updateSubCategory(tenantId, subCategoryId, payload) {
    try {
      const subCategory = await this.getSubCategoryById(tenantId, subCategoryId);

      // If categoryId is being changed, validate new category exists
      if (payload.categoryId && payload.categoryId !== subCategory.categoryId.toString()) {
        await CategoryService.getCategoryById(tenantId, payload.categoryId);
      }

      // Check for duplicate name if name is being updated
      if (payload.name && payload.name !== subCategory.name) {
        const existingSubCategory = await SubCategory.findOne({
          tenantId,
          categoryId: payload.categoryId || subCategory.categoryId,
          name: payload.name,
          _id: { $ne: subCategoryId },
          deletedAt: null
        });

        if (existingSubCategory) {
          throw new Error(`SubCategory "${payload.name}" already exists in this category`);
        }
      }

      Object.assign(subCategory, {
        name: payload.name || subCategory.name,
        code: payload.code !== undefined ? payload.code : subCategory.code,
        description: payload.description !== undefined ? payload.description : subCategory.description,
        categoryId: payload.categoryId || subCategory.categoryId,
        isActive: payload.isActive !== undefined ? payload.isActive : subCategory.isActive,
        updatedBy: payload.userId
      });

      await subCategory.save();
      await subCategory.populate('categoryId');
      return subCategory;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete sub-category
   */
  async deleteSubCategory(tenantId, subCategoryId) {
    try {
      const subCategory = await this.getSubCategoryById(tenantId, subCategoryId);

      subCategory.deletedAt = new Date();
      await subCategory.save();
      
      return { message: 'SubCategory deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if sub-categories exist
   */
  async subCategoriesExist(tenantId, subCategoryIds) {
    try {
      const count = await SubCategory.countDocuments({
        _id: { $in: subCategoryIds },
        tenantId,
        deletedAt: null
      });

      return count === subCategoryIds.length;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SubCategoryService();
