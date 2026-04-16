const CategoryService = require('./category.service');
const apiResponse = require('../../../utils/apiResponse');

class CategoryController {
  /**
   * Create Category
   */
  static async createCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { name, code, description, isActive } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json(apiResponse(false, 'Category name is required', null));
      }

      const category = await CategoryService.createCategory(tenantId, {
        name,
        code,
        description,
        isActive,
        userId: req.user._id
      });

      res.status(201).json(apiResponse(true, 'Category created successfully', category));
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * List all categories
   */
  static async listCategories(req, res) {
    try {
      const { tenantId } = req.user;
      const { isActive } = req.query;

      const filters = {};
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }

      const categories = await CategoryService.getCategories(tenantId, filters);

      res.status(200).json(
        apiResponse(true, 'Categories retrieved successfully', {
          count: categories.length,
          categories
        })
      );
    } catch (error) {
      console.error('Error listing categories:', error);
      res.status(500).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Get single category
   */
  static async getCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { categoryId } = req.params;

      const category = await CategoryService.getCategoryById(tenantId, categoryId);

      res.status(200).json(apiResponse(true, 'Category retrieved successfully', category));
    } catch (error) {
      console.error('Error getting category:', error);
      res.status(404).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Update category
   */
  static async updateCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { categoryId } = req.params;
      const { name, code, description, isActive } = req.body;

      const category = await CategoryService.updateCategory(tenantId, categoryId, {
        name,
        code,
        description,
        isActive,
        userId: req.user._id
      });

      res.status(200).json(apiResponse(true, 'Category updated successfully', category));
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { categoryId } = req.params;

      // TODO: Additional validation - check if category has sub-categories
      await CategoryService.deleteCategory(tenantId, categoryId);

      res.status(200).json(apiResponse(true, 'Category deleted successfully', null));
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }
}

module.exports = CategoryController;
