const BaseService = require('../../../shared/base.service');
const InventoryTransactionRepository = require('./inventoryTransaction.repository');
const Item = require('../../item/item.model');
const mongoose = require('mongoose');

class InventoryTransactionService extends BaseService {
  constructor() {
    super(InventoryTransactionRepository);
  }

  /**
   * GET STOCK BALANCE
   * Calculate current stock for item + warehouse
   */
  async getStockBalance({ tenantId, item, warehouse }) {
    const pipeline = [
      { $match: { tenantId, item, warehouse } },
      { $group: {
        _id: null,
        totalIn: { $sum: '$quantityIn' },
        totalOut: { $sum: '$quantityOut' }
      }}
    ];
    const result = await InventoryTransactionRepository.model.aggregate(pipeline);
    if (!result.length) return 0;
    return (result[0].totalIn || 0) - (result[0].totalOut || 0);
  }

  /**
   * GET CURRENT COST
   * Return current weighted average cost for an item
   */
  async getCurrentCost({ tenantId, itemId }) {
    const item = await Item.findOne({ _id: itemId, tenantId });
    if (!item) {
      throw new Error('Item not found');
    }
    return {
      itemId,
      tenantId,
      currentStock: item.currentStock || 0,
      avgCost: item.costPrice || 0,
      totalValue: (item.currentStock || 0) * (item.costPrice || 0)
    };
  }

  /**
   * ADD STOCK
   * Increase stock and recalculate weighted average cost
   * 
   * Formula: NewAvgCost = ((OldQty × OldCost) + (NewQty × NewCost)) / TotalQty
   */
  async addStock({ tenantId, itemId, warehouseId, quantity, unitCost, referenceId, referenceType, description, session }) {
    // Validate
    if (!tenantId) throw new Error('Tenant ID required');
    if (!itemId) throw new Error('Item ID required');
    if (!warehouseId) throw new Error('Warehouse ID required');
    if (!quantity || quantity <= 0) throw new Error('Quantity must be positive');
    if (!unitCost || unitCost < 0) throw new Error('Unit cost must be non-negative');

    const totalCost = quantity * unitCost;

    // Get current item data
    const item = await Item.findOne({ _id: itemId, tenantId }).session(session);
    if (!item) {
      throw new Error('Item not found');
    }

    const oldQty = item.currentStock || 0;
    const oldCost = item.costPrice || 0;
    const oldTotalValue = oldQty * oldCost;

    // Calculate new weighted average cost
    const newQty = oldQty + quantity;
    const newTotalValue = oldTotalValue + totalCost;
    const newAvgCost = newQty > 0 ? newTotalValue / newQty : 0;

    // Update item
    await Item.findOneAndUpdate(
      { _id: itemId, tenantId },
      {
        $inc: { currentStock: quantity },
        $set: { costPrice: newAvgCost, updatedAt: new Date() }
      },
      { session }
    );

    // Create inventory transaction record
    const transaction = new InventoryTransactionRepository.model({
      tenantId,
      item: itemId,
      warehouse: warehouseId,
      referenceId,
      referenceType,
      transactionType: 'IN',
      quantityIn: quantity,
      quantityOut: 0,
      unitCost,
      totalCost,
      prevQty: oldQty,
      prevAvgCost: oldCost,
      newQty,
      newAvgCost,
      description: description || `Stock in: ${quantity} @ ${unitCost}/kg`
    });

    await transaction.save({ session });

    return {
      success: true,
      itemId,
      warehouseId,
      quantity,
      unitCost,
      totalCost,
      prevQty: oldQty,
      prevAvgCost: oldCost,
      newQty,
      newAvgCost,
      transactionId: transaction._id
    };
  }

  /**
   * REMOVE STOCK
   * Decrease stock using CURRENT average cost (DO NOT recalculate avg cost)
   */
  async removeStock({ tenantId, itemId, warehouseId, quantity, referenceId, referenceType, description, session }) {
    // Validate
    if (!tenantId) throw new Error('Tenant ID required');
    if (!itemId) throw new Error('Item ID required');
    if (!warehouseId) throw new Error('Warehouse ID required');
    if (!quantity || quantity <= 0) throw new Error('Quantity must be positive');

    // Get current item data
    const item = await Item.findOne({ _id: itemId, tenantId }).session(session);
    if (!item) {
      throw new Error('Item not found');
    }

    // Check sufficient stock
    if (item.currentStock < quantity) {
      throw new Error(`Insufficient stock. Available: ${item.currentStock}, Required: ${quantity}`);
    }

    const oldQty = item.currentStock;
    const currentCost = item.costPrice || 0;
    const totalCost = quantity * currentCost;

    // Update item (reduce stock, keep same avg cost)
    await Item.findOneAndUpdate(
      { _id: itemId, tenantId },
      {
        $inc: { currentStock: -quantity },
        $set: { updatedAt: new Date() }
      },
      { session }
    );

    const newQty = oldQty - quantity;

    // Create inventory transaction record
    const transaction = new InventoryTransactionRepository.model({
      tenantId,
      item: itemId,
      warehouse: warehouseId,
      referenceId,
      referenceType,
      transactionType: 'OUT',
      quantityIn: 0,
      quantityOut: quantity,
      unitCost: currentCost,
      totalCost,
      prevQty: oldQty,
      prevAvgCost: currentCost,
      newQty,
      newAvgCost: currentCost,
      description: description || `Stock out: ${quantity} @ ${currentCost}/kg`
    });

    await transaction.save({ session });

    return {
      success: true,
      itemId,
      warehouseId,
      quantity,
      unitCost: currentCost,
      totalCost,
      prevQty: oldQty,
      prevAvgCost: currentCost,
      newQty,
      newAvgCost: currentCost,
      transactionId: transaction._id
    };
  }

  /**
   * GET STOCK LEDGER
   * Return all transactions for an item with running balance
   */
  async getStockLedger({ tenantId, itemId, warehouseId, fromDate, toDate }) {
    const query = { tenantId, item: itemId };
    if (warehouseId) query.warehouse = warehouseId;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const transactions = await InventoryTransactionRepository.model.find(query)
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    // Calculate running balance
    let runningQty = 0;
    const ledger = transactions.map(t => {
      runningQty += (t.quantityIn || 0) - (t.quantityOut || 0);
      return {
        ...t,
        balance: runningQty
      };
    });

    return ledger;
  }

  /**
   * GET STOCK SUMMARY
   * Return stock summary by warehouse for an item
   */
  async getStockSummary({ tenantId, itemId }) {
    const pipeline = [
      { $match: { tenantId, item: itemId } },
      { $group: {
        _id: '$warehouse',
        totalIn: { $sum: '$quantityIn' },
        totalOut: { $sum: '$quantityOut' },
        balance: { $sum: { $subtract: ['$quantityIn', '$quantityOut'] } },
        lastCost: { $last: '$newAvgCost' },
        lastTransaction: { $last: '$createdAt' }
      }}
    ];

    return await InventoryTransactionRepository.model.aggregate(pipeline);
  }
}

module.exports = new InventoryTransactionService();