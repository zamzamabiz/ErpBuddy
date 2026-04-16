const StockBalance = require('./stockBalance.model');
const stockBalanceService = require('./stockBalance.service');

/**
 * STOCK BALANCE CONTROLLER
 * Handles HTTP requests for inventory management
 */

/**
 * GET /api/inventory
 * Get all stock balances for the tenant
 */
async function getAllStock(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { warehouseId, itemId, status } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const query = { tenantId, deletedAt: null };

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    if (itemId) {
      query.itemId = itemId;
    }

    if (status) {
      query.status = status;
    }

    const stockRecords = await StockBalance.find(query)
      .populate('itemId', 'name sku unit')
      .populate('warehouseId', 'name location')
      .sort({ 'lastMovedAt': -1 });

    const totalValue = stockRecords.reduce((sum, record) => sum + (record.totalCostValue || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        count: stockRecords.length,
        totalValue,
        items: stockRecords
      },
      message: 'Stock records retrieved successfully'
    });
  } catch (error) {
    console.error('Get all stock error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve stock records'
    });
  }
}

/**
 * GET /api/inventory/warehouse/:warehouseId
 * Get stock for a specific warehouse
 */
async function getWarehouseStock(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { warehouseId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID is required'
      });
    }

    const result = await stockBalanceService.getWarehouseStock(tenantId, warehouseId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Warehouse stock retrieved successfully'
    });
  } catch (error) {
    console.error('Get warehouse stock error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve warehouse stock'
    });
  }
}

/**
 * GET /api/inventory/item/:itemId
 * Get total stock for a specific item across all warehouses
 */
async function getItemTotalStock(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { itemId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    const result = await stockBalanceService.getItemTotalStock(tenantId, itemId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Item total stock retrieved successfully'
    });
  } catch (error) {
    console.error('Get item total stock error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve item total stock'
    });
  }
}

/**
 * GET /api/inventory/low-stock
 * Get low stock items (below reorder level)
 */
async function getLowStockItems(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { warehouseId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const result = await stockBalanceService.getLowStockItems(tenantId, warehouseId || null);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Low stock items retrieved successfully'
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve low stock items'
    });
  }
}

/**
 * POST /api/inventory/check-availability
 * Check if stock is available for an item
 */
async function checkAvailability(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { itemId, warehouseId, quantity, batchNo } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!itemId || !warehouseId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Item ID, Warehouse ID, and Quantity are required'
      });
    }

    const result = await stockBalanceService.checkStockAvailability(
      tenantId,
      itemId,
      warehouseId,
      quantity,
      batchNo || null
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Stock availability checked'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to check stock availability'
    });
  }
}

/**
 * POST /api/inventory/increase
 * Increase stock (manual adjustment, internal use)
 */
async function increaseStock(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { itemId, warehouseId, quantity, costPrice, batchNo } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!itemId || !warehouseId || !quantity || !costPrice) {
      return res.status(400).json({
        success: false,
        message: 'Item ID, Warehouse ID, Quantity, and Cost Price are required'
      });
    }

    const result = await stockBalanceService.increaseStock(
      tenantId,
      itemId,
      warehouseId,
      quantity,
      costPrice,
      batchNo || null
    );

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Stock increased successfully'
    });
  } catch (error) {
    console.error('Increase stock error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to increase stock'
    });
  }
}

/**
 * POST /api/inventory/decrease
 * Decrease stock (manual adjustment, internal use)
 */
async function decreaseStock(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { itemId, warehouseId, quantity, batchNo } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!itemId || !warehouseId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Item ID, Warehouse ID, and Quantity are required'
      });
    }

    const result = await stockBalanceService.decreaseStock(
      tenantId,
      itemId,
      warehouseId,
      quantity,
      batchNo || null
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Stock decreased successfully'
    });
  } catch (error) {
    console.error('Decrease stock error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to decrease stock'
    });
  }
}

module.exports = {
  getAllStock,
  getWarehouseStock,
  getItemTotalStock,
  getLowStockItems,
  checkAvailability,
  increaseStock,
  decreaseStock
};
