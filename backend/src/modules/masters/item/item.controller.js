const ItemService = require('./item.service');
const apiResponse = require('../../../utils/apiResponse');

class ItemController {
  /**
   * Create Item
   */
  static async createItem(req, res) {
    try {
      const { tenantId } = req.user;
      const {
        name,
        sku,
        categoryId,
        subCategoryId,
        unit,
        itemType,
        isBatchTracked,
        costingMethod,
        defaultWarehouseId,
        purchasePrice,
        salesPrice,
        isActive,
        description
      } = req.body;

      // Validation
      if (!name || name.trim() === '') {
        return res.status(400).json(apiResponse(false, 'Item name is required', null));
      }

      if (!sku || sku.trim() === '') {
        return res.status(400).json(apiResponse(false, 'SKU is required', null));
      }

      if (!categoryId) {
        return res.status(400).json(apiResponse(false, 'Category ID is required', null));
      }

      if (!subCategoryId) {
        return res.status(400).json(apiResponse(false, 'SubCategory ID is required', null));
      }

      const item = await ItemService.createItem(tenantId, {
        name,
        sku,
        categoryId,
        subCategoryId,
        unit,
        itemType,
        isBatchTracked,
        costingMethod,
        defaultWarehouseId,
        purchasePrice,
        salesPrice,
        isActive,
        description,
        userId: req.user._id
      });

      res.status(201).json(apiResponse(true, 'Item created successfully', item));
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * List all items
   */
  static async listItems(req, res) {
    try {
      const { tenantId } = req.user;
      const { categoryId, subCategoryId, itemType, costingMethod, isActive } = req.query;

      const filters = {};
      if (categoryId) filters.categoryId = categoryId;
      if (subCategoryId) filters.subCategoryId = subCategoryId;
      if (itemType) filters.itemType = itemType;
      if (costingMethod) filters.costingMethod = costingMethod;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const items = await ItemService.getItems(tenantId, filters);

      res.status(200).json(
        apiResponse(true, 'Items retrieved successfully', {
          count: items.length,
          items
        })
      );
    } catch (error) {
      console.error('Error listing items:', error);
      res.status(500).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Get single item
   */
  static async getItem(req, res) {
    try {
      const { tenantId } = req.user;
      const { itemId } = req.params;

      const item = await ItemService.getItemById(tenantId, itemId);

      res.status(200).json(apiResponse(true, 'Item retrieved successfully', item));
    } catch (error) {
      console.error('Error getting item:', error);
      res.status(404).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Get item by SKU
   */
  static async getItemBySku(req, res) {
    try {
      const { tenantId } = req.user;
      const { sku } = req.params;

      const item = await ItemService.getItemBySku(tenantId, sku);

      if (!item) {
        return res.status(404).json(apiResponse(false, 'Item not found', null));
      }

      res.status(200).json(apiResponse(true, 'Item retrieved successfully', item));
    } catch (error) {
      console.error('Error getting item by SKU:', error);
      res.status(500).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Update item
   */
  static async updateItem(req, res) {
    try {
      const { tenantId } = req.user;
      const { itemId } = req.params;
      const {
        name,
        sku,
        categoryId,
        subCategoryId,
        unit,
        itemType,
        isBatchTracked,
        costingMethod,
        defaultWarehouseId,
        purchasePrice,
        salesPrice,
        isActive,
        description
      } = req.body;

      const item = await ItemService.updateItem(tenantId, itemId, {
        name,
        sku,
        categoryId,
        subCategoryId,
        unit,
        itemType,
        isBatchTracked,
        costingMethod,
        defaultWarehouseId,
        purchasePrice,
        salesPrice,
        isActive,
        description,
        userId: req.user._id
      });

      res.status(200).json(apiResponse(true, 'Item updated successfully', item));
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Delete item
   */
  static async deleteItem(req, res) {
    try {
      const { tenantId } = req.user;
      const { itemId } = req.params;

      // TODO: Additional validation - check if item has stock ledger entries
      await ItemService.deleteItem(tenantId, itemId);

      res.status(200).json(apiResponse(true, 'Item deleted successfully', null));
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(400).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Get items by category
   */
  static async getItemsByCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { categoryId } = req.params;

      const items = await ItemService.getItemsByCategory(tenantId, categoryId);

      res.status(200).json(
        apiResponse(true, 'Items retrieved successfully', {
          count: items.length,
          items
        })
      );
    } catch (error) {
      console.error('Error getting items by category:', error);
      res.status(500).json(apiResponse(false, error.message, null));
    }
  }

  /**
   * Get items by sub-category
   */
  static async getItemsBySubCategory(req, res) {
    try {
      const { tenantId } = req.user;
      const { subCategoryId } = req.params;

      const items = await ItemService.getItemsBySubCategory(tenantId, subCategoryId);

      res.status(200).json(
        apiResponse(true, 'Items retrieved successfully', {
          count: items.length,
          items
        })
      );
    } catch (error) {
      console.error('Error getting items by sub-category:', error);
      res.status(500).json(apiResponse(false, error.message, null));
    }
  }
}

module.exports = ItemController;
