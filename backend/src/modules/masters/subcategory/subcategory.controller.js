const SubCategoryService = require('./subcategory.service');
const apiResponse = require('../../../utils/apiResponse');

class SubCategoryController {
  /**
   * Create SubCategory
   */
  static async createSubCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { name, categoryId, code, description, isActive } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json(apiResponse(false, 'SubCategory name is required', null));
      }

      if (!categoryId) {
        return res.status(400).json(apiResponse(false, 'Category ID is required', null));
      }

      const subCategory = await SubCategoryService.createSubCategory(tenantId, {
        name,
        categoryId,
        code,
        description,
        isActive,
        userId: req.user._id
      });

      res.status(201).json(apiResponse(true, 'SubCategory created successfully', subCategory));
    } catch (error) {
      console.error('Error creating sub-category:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * List all sub-categories
   */
  static async listSubCategories(req, res) {
    try {
      const { tenantId } = req.user;
      const { categoryId, isActive } = req.query;

      const filters = {};
      if (categoryId) {
        filters.categoryId = categoryId;
      }
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }

      const subCategories = await SubCategoryService.getSubCategories(tenantId, filters);

      res.status(200).json(
        apiResponse(true, 'SubCategories retrieved successfully', {
          count: subCategories.length,
          subCategories
        })
      );
    } catch (error) {
      console.error('Error listing sub-categories:', error);
      res.status(500).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Get single sub-category
   */
  static async getSubCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { subCategoryId } = req.params;

      const subCategory = await SubCategoryService.getSubCategoryById(tenantId, subCategoryId);

      res.status(200).json(apiResponse(true, 'SubCategory retrieved successfully', subCategory));
    } catch (error) {
      console.error('Error getting sub-category:', error);
      res.status(404).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Update sub-category
   */
  static async updateSubCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { subCategoryId } = req.params;
      const { name, categoryId, code, description, isActive } = req.body;

      const subCategory = await SubCategoryService.updateSubCategory(tenantId, subCategoryId, {
        name,
        categoryId,
        code,
        description,
        isActive,
        userId: req.user._id
      });

      res.status(200).json(apiResponse(true, 'SubCategory updated successfully', subCategory));
    } catch (error) {
      console.error('Error updating sub-category:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Delete sub-category
   */
  static async deleteSubCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { subCategoryId } = req.params;

      // TODO: Additional validation - check if sub-category has items
      await SubCategoryService.deleteSubCategory(tenantId, subCategoryId);

      res.status(200).json(apiResponse(true, 'SubCategory deleted successfully', null));
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }
}

module.exports = SubCategoryController;
