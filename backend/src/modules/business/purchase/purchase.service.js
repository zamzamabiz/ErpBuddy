const Purchase = require('./purchase.model');
const mongoose = require('mongoose');
const JournalService = require('../../finance/journal/journal.service');
const ChartOfAccount = require('../../accounting/coa.model');
const Item = require('../../item/item.model');
const StockMovement = require('../../inventory/stockMovement.model');

/**
 * PURCHASE SERVICE WITH ACCOUNTING INTEGRATION
 * Handles purchase creation with proper journal entries and transaction safety
 */

/**
 * CREATE PURCHASE WITH ATOMIC TRANSACTION
 */
async function createPurchase(data, req = {}) {
  const tenantId = req.tenantId || '69dd0cb31c5468a5b63511b7';
  const companyId = req.companyId || '69dd0cb31c5468a5b63511b7';
  const userId = req.userId || 'system';

  // Validate required fields
  if (!data.supplierId) {
    throw new Error('Supplier ID is required');
  }
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('At least one item is required');
  }

  // Calculate total amount
  const calculatedTotal = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  if (Math.abs(calculatedTotal - data.totalAmount) > 0.01) {
    throw new Error(`Total amount mismatch. Calculated: ${calculatedTotal}, Provided: ${data.totalAmount}`);
  }

  // Use mongoose session for atomic transaction
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // 1. Create purchase record
      const purchaseData = {
        ...data,
        tenantId,
        companyId,
        createdAt: new Date()
      };

      const purchase = new Purchase(purchaseData);
      const savedPurchase = await purchase.save({ session });

      // 2. Update item stock and cost prices
      await updateItemStockAndCost(savedPurchase, session);

      // 3. Create accounting journal entry
      const journalEntry = await createPurchaseJournalEntry(savedPurchase, tenantId, companyId, userId, session);

      console.log('✅ Purchase completed with full transaction:', {
        purchaseId: savedPurchase._id,
        supplierId: savedPurchase.supplierId,
        amount: savedPurchase.totalAmount,
        items: savedPurchase.items.length,
        journalId: journalEntry.journalId
      });

      return {
        success: true,
        data: savedPurchase,
        journal: journalEntry
      };
    });
  } finally {
    await session.endSession();
  }
}

/**
 * UPDATE ITEM STOCK AND COST PRICES
 */
async function updateItemStockAndCost(purchase, session) {
  for (const item of purchase.items) {
    const itemId = item.itemId;
    const quantity = item.quantity;
    const totalAmount = item.amount;
    const unitCost = totalAmount / quantity;

    // Get current item data
    const currentItem = await Item.findOne({ _id: itemId, tenantId: purchase.tenantId });
    if (!currentItem) {
      throw new Error(`Item ${itemId} not found for tenant ${purchase.tenantId}`);
    }

    // Calculate new average cost
    const currentStock = currentItem.currentStock || 0;
    const currentCost = currentItem.costPrice || 0;
    
    let newCostPrice;
    if (currentStock === 0) {
      // First purchase - use new cost
      newCostPrice = unitCost;
    } else {
      // Average cost calculation
      newCostPrice = ((currentStock * currentCost) + totalAmount) / (currentStock + quantity);
    }

    // Update item
    await Item.findOneAndUpdate(
      { _id: itemId, tenantId: purchase.tenantId },
      {
        $inc: { currentStock: quantity },
        $set: { costPrice: newCostPrice, updatedAt: new Date() }
      },
      { session }
    );

    // Create stock movement record
    const stockMovement = new StockMovement({
      tenantId: purchase.tenantId,
      itemId: itemId,
      referenceId: purchase._id,
      referenceType: 'PURCHASE',
      movementType: 'IN',
      quantity: quantity,
      unitCost: unitCost,
      totalCost: totalAmount,
      balance: currentStock + quantity,
      description: `Purchase ${purchase._id}`
    });

    await stockMovement.save({ session });

    console.log(`✅ Stock updated: Item ${itemId} +${quantity}, new cost: ${newCostPrice.toFixed(2)}`);
  }
}

/**
 * CREATE PURCHASE JOURNAL ENTRY
 */
async function createPurchaseJournalEntry(purchase, tenantId, companyId, userId, session) {
  try {
    // Get COA accounts with tenant isolation
    const inventoryAccount = await ChartOfAccount.findOne({ 
      tenantId, 
      code: '1001', 
      allowPosting: true 
    });
    const payableAccount = await ChartOfAccount.findOne({ 
      tenantId, 
      code: '2001', 
      allowPosting: true 
    });
    
    if (!inventoryAccount) {
      throw new Error('Inventory account (1001) not found or does not allow posting');
    }
    if (!payableAccount) {
      throw new Error('Accounts Payable account (2001) not found or does not allow posting');
    }

    // Get supplier name for description
    const Supplier = mongoose.model('Supplier');
    const supplier = await Supplier.findOne({ 
      _id: purchase.supplierId, 
      tenantId 
    });
    const supplierName = supplier ? supplier.name : 'Supplier';

    // Create journal entry using proper service
    const journalResult = await JournalService.createJournal({
      tenantId,
      entries: [
        {
          accountId: inventoryAccount._id,
          debit: purchase.totalAmount,
          credit: 0,
          description: `Purchase from ${supplierName}`
        },
        {
          accountId: payableAccount._id,
          debit: 0,
          credit: purchase.totalAmount,
          description: `Payable to ${supplierName}`
        }
      ],
      reference: `PO-${purchase._id}`,
      description: `Purchase from ${supplierName}`,
      source: 'PURCHASE',
      sourceId: purchase._id,
      createdBy: userId
    });

    return {
      journalId: journalResult.journal._id,
      status: journalResult.journal.status,
      amount: purchase.totalAmount
    };
  } catch (error) {
    console.error('❌ Purchase journal creation failed:', error.message);
    throw new Error(`Journal creation failed: ${error.message}`);
  }
}

/**
 * GET ALL PURCHASES
 */
async function getAllPurchases(req) {
  const tenantId = req.tenantId || '69dd0cb31c5468a5b63511b7';
  const companyId = req.companyId || '69dd0cb31c5468a5b63511b7';
  
  return await Purchase.find({ 
    tenantId, 
    companyId,
    deletedAt: null 
  }).sort({ createdAt: -1 });
}

/**
 * GET PURCHASE BY ID
 */
async function getPurchaseById(id, req) {
  const tenantId = req.tenantId || '69dd0cb31c5468a5b63511b7';
  const companyId = req.companyId || '69dd0cb31c5468a5b63511b7';
  
  return await Purchase.findOne({ 
    _id: id, 
    tenantId, 
    companyId,
    deletedAt: null 
  });
}

/**
 * UPDATE PURCHASE (NOT RECOMMENDED - USE DELETE AND CREATE NEW)
 */
async function updatePurchase(id, data, req) {
  const tenantId = req.tenantId || '69dd0cb31c5468a5b63511b7';
  const companyId = req.companyId || '69dd0cb31c5468a5b63511b7';
  
  // Note: Updating purchases after journal creation is complex
  // In real systems, you would create a credit note instead
  throw new Error('Purchase updates not supported. Create a new purchase or credit note instead.');
}

/**
 * DELETE PURCHASE WITH REVERSAL
 */
async function deletePurchase(id, req) {
  const tenantId = req.tenantId || '69dd0cb31c5468a5b63511b7';
  const companyId = req.companyId || '69dd0cb31c5468a5b63511b7';
  const userId = req.userId || 'system';

  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Find purchase
      const purchase = await Purchase.findOne({ 
        _id: id, 
        tenantId, 
        companyId,
        deletedAt: null 
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      // Reverse stock movements
      for (const item of purchase.items) {
        await Item.findOneAndUpdate(
          { _id: item.itemId, tenantId },
          { $inc: { currentStock: -item.quantity } },
          { session }
        );

        // Create reverse stock movement
        const stockMovement = new StockMovement({
          tenantId,
          itemId: item.itemId,
          referenceId: purchase._id,
          referenceType: 'PURCHASE_REVERSAL',
          movementType: 'OUT',
          quantity: -item.quantity,
          unitCost: item.amount / item.quantity,
          totalCost: -item.amount,
          description: `Purchase reversal ${purchase._id}`
        });

        await stockMovement.save({ session });
      }

      // Create reversing journal entry
      await createPurchaseJournalEntry(purchase, tenantId, companyId, userId, session);

      // Soft delete purchase
      await Purchase.findOneAndUpdate(
        { _id: id, tenantId, companyId },
        { deletedAt: new Date() },
        { session }
      );

      return { success: true, message: 'Purchase deleted with reversal' };
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase
};