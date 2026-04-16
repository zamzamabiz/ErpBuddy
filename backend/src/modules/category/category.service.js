const Category = require('./category.model');

/**
 * 🌳 CATEGORY SERVICE
 * 
 * Business logic for hierarchical categories.
 * Handles:
 * - Tree structure validation
 * - Level calculation
 * - Duplicate detection
 * - Tenant isolation
 */

class CategoryService {
  /**
   * ✅ CREATE CATEGORY
   * 
   * @param {Object} data - Category data
   * @param {string} data.name - Category name
   * @param {string} data.parentId - Parent category ID (optional)
   * @param {string} tenantId - Tenant ID (required)
   * @returns {Promise<Object>} Created category
   */
  async createCategory(data, tenantId) {
    const { name, parentId } = data;

    // 1️⃣ VALIDATE INPUT
    if (!name || !name.trim()) {
      throw new Error('Category name is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // 2️⃣ VALIDATE ObjectId format
    if (parentId && !parentId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid parent category ID format');
    }

    // 3️⃣ CHECK DUPLICATE (name + parentId + tenantId)
    const existingCategory = await Category.findOne({
      name: name.trim(),
      parentId: parentId || null,
      tenantId,
      deletedAt: null,
    });

    if (existingCategory) {
      throw new Error(`Category "${name}" already exists under this parent in your tenant`);
    }

    // 4️⃣ CALCULATE LEVEL
    let level = 1;
    let parent = null;

    if (parentId) {
      // Check if parent exists
      parent = await Category.findOne({
        _id: parentId,
        tenantId,
        deletedAt: null,
      });

      if (!parent) {
        throw new Error('Parent category not found or deleted');
      }

      // Calculate child level
      level = parent.level + 1;

      // 5️⃣ VALIDATE MAX DEPTH (max level = 4)
      if (level > 4) {
        throw new Error('Cannot create category deeper than 4 levels. Max depth reached.');
      }
    }

    // 6️⃣ CREATE CATEGORY
    try {
      const category = new Category({
        name: name.trim(),
        parentId: parentId || null,
        level,
        tenantId,
        isActive: true,
      });

      await category.save();

      console.log(`✅ Category created: ${category.name} (Level ${category.level})`);
      return category.toJSON();
    } catch (err) {
      console.error('❌ Category creation failed:', err.message);
      throw new Error(`Failed to create category: ${err.message}`);
    }
  }

  /**
   * ✅ GET ALL CATEGORIES (for tenant)
   * 
   * Returns hierarchical tree grouped by parent.
   * 
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} All categories for tenant
   */
  async getAllCategories(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      const categories = await Category.find({
        tenantId,
        deletedAt: null,
      })
        .sort({ level: 1, name: 1 })
        .lean();

      console.log(`✅ Retrieved ${categories.length} categories for tenant ${tenantId}`);
      return categories;
    } catch (err) {
      console.error('❌ Failed to retrieve categories:', err.message);
      throw new Error(`Failed to retrieve categories: ${err.message}`);
    }
  }

  /**
   * ✅ GET CATEGORY BY ID
   * 
   * @param {string} categoryId - Category ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Category object or null
   */
  async getCategoryById(categoryId, tenantId) {
    if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid category ID format');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      const category = await Category.findOne({
        _id: categoryId,
        tenantId,
        deletedAt: null,
      }).lean();

      if (!category) {
        console.log(`⚠️ Category not found: ${categoryId}`);
        return null;
      }

      console.log(`✅ Category retrieved: ${category.name}`);
      return category;
    } catch (err) {
      console.error('❌ Failed to retrieve category:', err.message);
      throw new Error(`Failed to retrieve category: ${err.message}`);
    }
  }

  /**
   * ✅ GET CATEGORY TREE
   * 
   * Returns hierarchical tree structure for frontend.
   * 
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} Root categories with nested children
   */
  async getCategoryTree(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      // Get all categories
      const allCategories = await Category.find({
        tenantId,
        deletedAt: null,
      })
        .sort({ level: 1, name: 1 })
        .lean();

      // Build tree structure
      const categoryMap = {};
      const roots = [];

      // First pass: index all categories
      allCategories.forEach((cat) => {
        categoryMap[cat._id] = { ...cat, children: [] };
      });

      // Second pass: build parent-child relationships
      allCategories.forEach((cat) => {
        if (cat.parentId && categoryMap[cat.parentId]) {
          categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
        } else if (!cat.parentId) {
          roots.push(categoryMap[cat._id]);
        }
      });

      console.log(`✅ Category tree retrieved: ${roots.length} root categories`);
      return roots;
    } catch (err) {
      console.error('❌ Failed to retrieve category tree:', err.message);
      throw new Error(`Failed to retrieve category tree: ${err.message}`);
    }
  }

  /**
   * ✅ GET CHILDREN OF CATEGORY
   * 
   * @param {string} parentId - Parent category ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} Child categories
   */
  async getChildren(parentId, tenantId) {
    if (!parentId || !parentId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid parent category ID format');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      const children = await Category.find({
        parentId,
        tenantId,
        deletedAt: null,
      })
        .sort({ name: 1 })
        .lean();

      console.log(`✅ Retrieved ${children.length} children for parent ${parentId}`);
      return children;
    } catch (err) {
      console.error('❌ Failed to retrieve children:', err.message);
      throw new Error(`Failed to retrieve children: ${err.message}`);
    }
  }
}

module.exports = new CategoryService();
