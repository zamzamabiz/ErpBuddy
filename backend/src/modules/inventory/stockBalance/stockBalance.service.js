const StockBalance = require('./stockBalance.model');

/**
 * STOCK BALANCE SERVICE
 * Manages stock levels across warehouses with batch tracking
 */

/**
 * Get or create stock balance for an item in a warehouse
 */
async function getOrCreateStockBalance(tenantId, itemId, warehouseId, batchNo = null) {
  try {
    const query = {
      tenantId,
      itemId,
      warehouseId,
      ...(batchNo && { batchNo })
    };

    let stockBalance = await StockBalance.findOne(query);

    if (!stockBalance) {
      // Create new stock balance
      stockBalance = new StockBalance({
        tenantId,
        itemId,
        warehouseId,
        batchNo,
        quantity: 0,
        costPrice: 0,
        totalCostValue: 0
      });

      await stockBalance.save();
    }

    return stockBalance;
  } catch (error) {
    throw new Error(`Failed to get/create stock balance: ${error.message}`);
  }
}

/**
 * Increase stock quantity on hand
 * Used for purchase receipts, stock transfers, etc.
 */
async function increaseStock(tenantId, itemId, warehouseId, quantity, costPrice, batchNo = null) {
  try {
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (costPrice < 0) {
      throw new Error('Cost price cannot be negative');
    }

    const query = {
      tenantId,
      itemId,
      warehouseId,
      ...(batchNo && { batchNo })
    };

    // Get existing stock or create new
    let stockBalance = await StockBalance.findOne(query);

    if (stockBalance) {
      // Update existing
      // Weighted average cost: (oldQty × oldCost + newQty × newCost) / (oldQty + newQty)
      const totalOldCost = stockBalance.quantity * stockBalance.costPrice;
      const totalNewCost = quantity * costPrice;
      const newQuantity = stockBalance.quantity + quantity;
      const newAverageCost = newQuantity > 0 ? (totalOldCost + totalNewCost) / newQuantity : costPrice;

      stockBalance.quantity = newQuantity;
      stockBalance.costPrice = newAverageCost;
      stockBalance.totalCostValue = (newQuantity * newAverageCost).toFixed(2);
      stockBalance.lastMovedAt = new Date();
    } else {
      // Create new stock balance
      stockBalance = new StockBalance({
        tenantId,
        itemId,
        warehouseId,
        batchNo,
        quantity,
        costPrice,
        totalCostValue: (quantity * costPrice).toFixed(2),
        lastMovedAt: new Date()
      });
    }

    await stockBalance.save();
    return stockBalance;
  } catch (error) {
    throw new Error(`Failed to increase stock: ${error.message}`);
  }
}

/**
 * Decrease stock quantity on hand
 * Used for sales, consumption, adjustments, etc.
 */
async function decreaseStock(tenantId, itemId, warehouseId, quantity, batchNo = null) {
  try {
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const query = {
      tenantId,
      itemId,
      warehouseId,
      ...(batchNo && { batchNo })
    };

    const stockBalance = await StockBalance.findOne(query);

    if (!stockBalance) {
      throw new Error(`Stock not found for item ${itemId} in warehouse ${warehouseId}`);
    }

    if (stockBalance.quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${stockBalance.quantity}, Requested: ${quantity}`);
    }

    // Decrease quantity (cost price remains unchanged for FIFO/LIFO purposes)
    stockBalance.quantity -= quantity;
    stockBalance.totalCostValue = (stockBalance.quantity * stockBalance.costPrice).toFixed(2);
    stockBalance.lastMovedAt = new Date();

    await stockBalance.save();
    return stockBalance;
  } catch (error) {
    throw new Error(`Failed to decrease stock: ${error.message}`);
  }
}

/**
 * Get total stock for an item across all warehouses
 */
async function getItemTotalStock(tenantId, itemId) {
  try {
    const stockRecords = await StockBalance.find({
      tenantId,
      itemId,
      deletedAt: null
    });

    const totalQuantity = stockRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
    const totalCostValue = stockRecords.reduce((sum, record) => sum + (record.totalCostValue || 0), 0);

    return {
      itemId,
      totalQuantity,
      totalCostValue,
      warehouseBreakdown: stockRecords.map(record => ({
        warehouseId: record.warehouseId,
        quantity: record.quantity,
        costPrice: record.costPrice,
        totalCostValue: record.totalCostValue,
        batchNo: record.batchNo
      }))
    };
  } catch (error) {
    throw new Error(`Failed to get item total stock: ${error.message}`);
  }
}

/**
 * Get stock for a specific warehouse
 */
async function getWarehouseStock(tenantId, warehouseId) {
  try {
    const stockRecords = await StockBalance.find({
      tenantId,
      warehouseId,
      deletedAt: null,
      quantity: { $gt: 0 }
    })
      .populate('itemId', 'name sku unit')
      .sort({ 'lastMovedAt': -1 });

    const totalValue = stockRecords.reduce((sum, record) => sum + (record.totalCostValue || 0), 0);

    return {
      warehouseId,
      itemCount: stockRecords.length,
      totalStockValue: totalValue,
      items: stockRecords
    };
  } catch (error) {
    throw new Error(`Failed to get warehouse stock: ${error.message}`);
  }
}

/**
 * Check if stock is available
 */
async function checkStockAvailability(tenantId, itemId, warehouseId, requiredQuantity, batchNo = null) {
  try {
    const query = {
      tenantId,
      itemId,
      warehouseId,
      ...(batchNo && { batchNo })
    };

    const stockBalance = await StockBalance.findOne(query);

    if (!stockBalance) {
      return {
        available: false,
        availableQuantity: 0,
        requiredQuantity,
        message: 'Stock not found'
      };
    }

    const available = stockBalance.quantity >= requiredQuantity;

    return {
      available,
      availableQuantity: stockBalance.quantity,
      requiredQuantity,
      message: available ? 'Stock available' : `Insufficient stock. Available: ${stockBalance.quantity}`
    };
  } catch (error) {
    throw new Error(`Failed to check stock availability: ${error.message}`);
  }
}

/**
 * Get low stock items (below reorder level)
 */
async function getLowStockItems(tenantId, warehouseId = null) {
  try {
    const query = {
      tenantId,
      deletedAt: null,
      $expr: { $lt: ['$quantity', '$reorderLevel'] }
    };

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    const lowStockItems = await StockBalance.find(query)
      .populate('itemId', 'name sku unit')
      .populate('warehouseId', 'name location')
      .sort({ 'quantity': 1 });

    return {
      count: lowStockItems.length,
      items: lowStockItems
    };
  } catch (error) {
    throw new Error(`Failed to get low stock items: ${error.message}`);
  }
}

module.exports = {
  getOrCreateStockBalance,
  increaseStock,
  decreaseStock,
  getItemTotalStock,
  getWarehouseStock,
  checkStockAvailability,
  getLowStockItems
};
