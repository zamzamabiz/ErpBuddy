const categoryService = require('./category.service');

/**
 * 🌳 CATEGORY CONTROLLER
 * 
 * HTTP request handlers for category operations.
 * Enforces tenantId from request context.
 */

class CategoryController {
  /**
   * ✅ POST /api/categories
   * Create a new category
   */
  async createCategory(req, res) {
    try {
      // Read tenantId from header (x-tenant-id)
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }

      const { name, parentId } = req.body;

      const category = await categoryService.createCategory(
        { name, parentId },
        tenantId
      );

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (err) {
      console.error('❌ Create category error:', err.message);

      // 400 for validation errors
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to create category',
      });
    }
  }

  /**
   * ✅ GET /api/categories
   * Get all categories (flat list or tree)
   * Query params: ?tree=true (returns nested structure, default=flat list)
   */
  async getCategories(req, res) {
    try {
      // Read tenantId from header (x-tenant-id)
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }

      const { tree } = req.query;

      let categories;
      if (tree === 'true') {
        // Return hierarchical tree
        categories = await categoryService.getCategoryTree(tenantId);
      } else {
        // Return flat list
        categories = await categoryService.getAllCategories(tenantId);
      }

      return res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
        count: Array.isArray(categories)
          ? categories.length
          : categories.reduce((acc, root) => acc + 1 + (root.children?.length || 0), 0),
      });
    } catch (err) {
      console.error('❌ Get categories error:', err.message);

      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve categories',
      });
    }
  }

  /**
   * ✅ GET /api/categories/:id
   * Get single category
   */
  async getCategory(req, res) {
    try {
      // Read tenantId from header (x-tenant-id)
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }

      const { id } = req.params;

      const category = await categoryService.getCategoryById(id, tenantId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (err) {
      console.error('❌ Get category error:', err.message);

      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to retrieve category',
      });
    }
  }

  /**
   * ✅ GET /api/categories/:id/children
   * Get direct children of category
   */
  async getChildren(req, res) {
    try {
      // Read tenantId from header (x-tenant-id)
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }

      const { id } = req.params;

      const children = await categoryService.getChildren(id, tenantId);

      return res.status(200).json({
        success: true,
        message: 'Children retrieved successfully',
        data: children,
        count: children.length,
      });
    } catch (err) {
      console.error('❌ Get children error:', err.message);

      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to retrieve children',
      });
    }
  }
}

module.exports = new CategoryController();
