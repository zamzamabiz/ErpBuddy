const Category = require('./category.model');

class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(tenantId, payload) {
    try {
      // Check if category with same name already exists for this tenant
      const existingCategory = await Category.findOne({
        tenantId,
        name: payload.name,
        deletedAt: null
      });

      if (existingCategory) {
        throw new Error(`Category "${payload.name}" already exists for this tenant`);
      }

      const category = await Category.create({
        tenantId,
        name: payload.name,
        code: payload.code || '',
        description: payload.description || '',
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        createdBy: payload.userId
      });

      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all categories for a tenant
   */
  async getCategories(tenantId, filters = {}) {
    try {
      const query = {
        tenantId,
        deletedAt: null
      };

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const categories = await Category.find(query)
        .select('-deletedAt')
        .sort({ createdAt: -1 });

      return categories;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(tenantId, categoryId) {
    try {
      const category = await Category.findOne({
        _id: categoryId,
        tenantId,
        deletedAt: null
      }).select('-deletedAt');

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(tenantId, categoryId, payload) {
    try {
      const category = await this.getCategoryById(tenantId, categoryId);

      // Check for duplicate name if name is being updated
      if (payload.name && payload.name !== category.name) {
        const existingCategory = await Category.findOne({
          tenantId,
          name: payload.name,
          _id: { $ne: categoryId },
          deletedAt: null
        });

        if (existingCategory) {
          throw new Error(`Category "${payload.name}" already exists for this tenant`);
        }
      }

      Object.assign(category, {
        name: payload.name || category.name,
        code: payload.code !== undefined ? payload.code : category.code,
        description: payload.description !== undefined ? payload.description : category.description,
        isActive: payload.isActive !== undefined ? payload.isActive : category.isActive,
        updatedBy: payload.userId
      });

      await category.save();
      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete category
   */
  async deleteCategory(tenantId, categoryId) {
    try {
      const category = await this.getCategoryById(tenantId, categoryId);

      category.deletedAt = new Date();
      category.updatedBy = payload.userId;

      await category.save();
      return { message: 'Category deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get category by name
   */
  async getCategoryByName(tenantId, name) {
    try {
      const category = await Category.findOne({
        tenantId,
        name,
        deletedAt: null
      }).select('-deletedAt');

      return category;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if categories exist
   */
  async categoriesExist(tenantId, categoryIds) {
    try {
      const count = await Category.countDocuments({
        _id: { $in: categoryIds },
        tenantId,
        deletedAt: null
      });

      return count === categoryIds.length;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CategoryService();
