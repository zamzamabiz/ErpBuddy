const itemService = require('./item.service');

class ItemController {
  /**
   * Create a new item
   * POST /api/items
   */
  async createItem(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'x-tenant-id header is missing',
        });
      }

      const {
        name,
        sku,
        categoryId,
        brandId,
        unit,
        isBatchEnabled,
        isSerialEnabled,
        purchasePrice,
        salePrice,
        taxType,
        attributes,
        isActive,
      } = req.body;

      const item = await itemService.createItem(
        {
          name,
          sku,
          categoryId,
          brandId,
          unit,
          isBatchEnabled,
          isSerialEnabled,
          purchasePrice,
          salePrice,
          taxType,
          attributes,
          isActive,
        },
        tenantId
      );

      return res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: item,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        message: 'Failed to create item',
      });
    }
  }

  /**
   * Get all items
   * GET /api/items
   */
  async getItems(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'x-tenant-id header is missing',
        });
      }

      const items = await itemService.getAllItems(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Items retrieved successfully',
        data: items,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: 'Failed to retrieve items',
      });
    }
  }

  /**
   * Get an item by ID
   * GET /api/items/:id
   */
  async getItem(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'x-tenant-id header is missing',
        });
      }

      const { id } = req.params;

      const item = await itemService.getItemById(id, tenantId);

      return res.status(200).json({
        success: true,
        message: 'Item retrieved successfully',
        data: item,
      });
    } catch (error) {
      if (error.message === 'Item not found') {
        return res.status(404).json({
          error: error.message,
          message: 'Item not found',
        });
      }

      return res.status(500).json({
        error: error.message,
        message: 'Failed to retrieve item',
      });
    }
  }
}

module.exports = new ItemController();
