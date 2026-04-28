const Milling = require('./milling.model');
const Item = require('../../item/item.model');
const mongoose = require('mongoose');
const JournalService = require('../../finance/journal/journal.service');
const ChartOfAccount = require('../../accounting/coa.model');
const StockMovement = require('../../inventory/stockMovement.model');
const inventoryTransactionService = require('../../engines/inventoryEngine/inventoryTransaction.service');

/**
 * MILLING SERVICE
 * Handles paddy to rice conversion with proper stock and accounting integration
 * 
 * BUSINESS LOGIC:
 * - Input: Paddy (raw material)
 * - Output: Rice (main product) + Broken + Husk (byproducts)
 * - Cost allocation based on output ratios
 */

/**
 * CREATE MILLING TRANSACTION
 * Converts paddy to rice and byproducts with full transaction safety
 */
async function createMilling(data, req = {}) {
  // CRITICAL: Tenant ID must be provided - no fallback allowed
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const userId = req.userId || 'system';

  // Validate required fields
  if (!data.paddyItemId) {
    throw new Error('Paddy item ID is required');
  }
  if (!data.quantity || data.quantity <= 0) {
    throw new Error('Quantity must be positive');
  }
  if (!data.godownId) {
    throw new Error('Godown ID is required');
  }

  // Default output ratios (can be overridden)
  const ratios = data.ratios || {
    rice: 0.80,
    broken: 0.15,
    husk: 0.05
  };

  // Validate ratios sum to 1
  const ratioSum = ratios.rice + ratios.broken + ratios.husk;
  if (Math.abs(ratioSum - 1) > 0.01) {
    throw new Error('Output ratios must sum to 1');
  }

  // Use mongoose session for atomic transaction
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      // 1. Get paddy item and verify stock
      const paddyItem = await Item.findOne({
        _id: data.paddyItemId,
        tenantId
      }).session(session);

      if (!paddyItem) {
        throw new Error('Paddy item not found');
      }

      // Check sufficient stock
      if (paddyItem.currentStock < data.quantity) {
        throw new Error(`Insufficient paddy stock. Available: ${paddyItem.currentStock}, Required: ${data.quantity}`);
      }

      // 2. Get or create output items
      const outputItems = await getOrCreateOutputItems(data, tenantId, session);

      // 3. Calculate costs
      const inputCost = data.quantity * paddyItem.costPrice;
      const processingCost = data.processingCost || 0;
      const totalCost = inputCost + processingCost;

      // 4. Calculate output quantities and allocate costs
      const outputs = calculateOutputs(data.quantity, totalCost, ratios, outputItems, data.godownId);

      // 4b. Validate total output quantity (must be within 90-105% of input)
      const totalOutputQty = outputs.reduce((sum, o) => sum + o.quantity, 0);
      if (totalOutputQty > data.quantity * 1.05 || totalOutputQty < data.quantity * 0.90) {
        throw new Error(`Invalid milling output quantity. Total output: ${totalOutputQty}kg, Input: ${data.quantity}kg. Expected range: ${data.quantity * 0.90}kg - ${data.quantity * 1.05}kg`);
      }

      // 5. Generate batch number
      const batchNumber = await Milling.generateBatchNumber();

      // 6. Create milling record
      const millingData = {
        tenantId,
        batchNumber,
        input: {
          paddyItemId: data.paddyItemId,
          quantity: data.quantity,
          unitCost: paddyItem.costPrice,
          totalCost: inputCost,
          godownId: data.godownId
        },
        processingCost,
        totalProcessingCost: totalCost,
        outputs,
        millingDate: data.millingDate || new Date(),
        status: 'processing',
        createdBy: userId
      };

      const milling = new Milling(millingData);
      const savedMilling = await milling.save({ session });

      // 7. Update stock - Reduce paddy using inventory engine
      const paddyResult = await inventoryTransactionService.removeStock({
        tenantId,
        itemId: data.paddyItemId,
        warehouseId: data.godownId,
        quantity: data.quantity,
        referenceId: savedMilling._id,
        referenceType: 'MILLING',
        description: `Milling ${batchNumber} - Paddy input`,
        session
      });

      // 8. Update stock - Increase outputs using inventory engine
      for (const output of outputs) {
        const outputResult = await inventoryTransactionService.addStock({
          tenantId,
          itemId: output.itemId,
          warehouseId: output.godownId,
          quantity: output.quantity,
          unitCost: output.unitCost,
          referenceId: savedMilling._id,
          referenceType: 'MILLING',
          description: `Milling ${batchNumber} - ${output.itemType} output`,
          session
        });
      }

      // 9. Create accounting journal entry
      const journalEntry = await createMillingJournalEntry(savedMilling, tenantId, userId, session);
      savedMilling.references.journalId = journalEntry.journalId;

      // 10. Mark as completed
      savedMilling.status = 'completed';
      await savedMilling.save({ session });

      console.log('✅ Milling completed:', {
        batchNumber: savedMilling.batchNumber,
        input: `${data.quantity}kg paddy`,
        outputs: outputs.map(o => `${o.quantity}kg ${o.itemType}`).join(', '),
        totalCost: totalCost
      });

      return {
        success: true,
        data: savedMilling,
        journal: journalEntry
      };
    });
  } finally {
    await session.endSession();
  }
}

/**
 * GET OR CREATE OUTPUT ITEMS
 * Ensures rice, broken, and husk items exist for the tenant
 */
async function getOrCreateOutputItems(data, tenantId, session) {
  const items = {};

  // Rice item
  if (data.riceItemId) {
    items.rice = await Item.findOne({ _id: data.riceItemId, tenantId }).session(session);
  }
  if (!items.rice) {
    items.rice = await getOrCreateItem('Rice', 'rice', tenantId, session);
  }

  // Broken item
  if (data.brokenItemId) {
    items.broken = await Item.findOne({ _id: data.brokenItemId, tenantId }).session(session);
  }
  if (!items.broken) {
    items.broken = await getOrCreateItem('Broken Rice', 'broken', tenantId, session);
  }

  // Husk item
  if (data.huskItemId) {
    items.husk = await Item.findOne({ _id: data.huskItemId, tenantId }).session(session);
  }
  if (!items.husk) {
    items.husk = await getOrCreateItem('Rice Husk', 'husk', tenantId, session);
  }

  return items;
}

/**
 * GET OR CREATE ITEM
 * Helper to get or create an item if it doesn't exist
 */
async function getOrCreateItem(name, type, tenantId, session) {
  let item = await Item.findOne({ name, tenantId }).session(session);

  if (!item) {
    item = new Item({
      tenantId,
      name,
      itemType: type,
      currentStock: 0,
      costPrice: 0,
      isActive: true
    });
    await item.save({ session });
  }

  return item;
}

/**
 * CALCULATE OUTPUTS
 * Allocates total cost to outputs based on ratios
 */
function calculateOutputs(inputQty, totalCost, ratios, items, godownId) {
  const outputs = [];

  // Rice output
  outputs.push({
    itemId: items.rice._id,
    itemType: 'rice',
    quantity: Math.round(inputQty * ratios.rice * 100) / 100, // Round to 2 decimal places
    allocatedCost: Math.round(totalCost * ratios.rice * 100) / 100,
    unitCost: 0, // Will be calculated after
    ratio: ratios.rice,
    godownId
  });

  // Broken output
  outputs.push({
    itemId: items.broken._id,
    itemType: 'broken',
    quantity: Math.round(inputQty * ratios.broken * 100) / 100,
    allocatedCost: Math.round(totalCost * ratios.broken * 100) / 100,
    unitCost: 0,
    ratio: ratios.broken,
    godownId
  });

  // Husk output
  outputs.push({
    itemId: items.husk._id,
    itemType: 'husk',
    quantity: Math.round(inputQty * ratios.husk * 100) / 100,
    allocatedCost: Math.round(totalCost * ratios.husk * 100) / 100,
    unitCost: 0,
    ratio: ratios.husk,
    godownId
  });

  // Calculate unit costs
  for (const output of outputs) {
    if (output.quantity > 0) {
      output.unitCost = Math.round((output.allocatedCost / output.quantity) * 100) / 100;
    }
  }

  return outputs;
}

/**
 * CREATE MILLING JOURNAL ENTRY
 * 
 * Proper accounting structure:
 * DR Rice Inventory (main product)
 * DR Broken Inventory (byproduct)
 * DR Husk Inventory (byproduct)
 * DR Processing Expense (if any)
 *     CR Raw Material (Paddy)
 *     CR Cash / Payable (for processing cost)
 */
async function createMillingJournalEntry(milling, tenantId, userId, session) {
  try {
    // Get COA accounts for each output type
    const riceInventoryAccount = await ChartOfAccount.findOne({
      tenantId,
      code: '1002', // Finished Goods / Rice Inventory
      allowPosting: true
    }).session(session);

    const byproductAccount = await ChartOfAccount.findOne({
      tenantId,
      code: '1004', // Byproducts Inventory
      allowPosting: true
    }).session(session);

    const rawMaterialAccount = await ChartOfAccount.findOne({
      tenantId,
      code: '1003', // Raw Materials
      allowPosting: true
    }).session(session);

    const processingExpenseAccount = await ChartOfAccount.findOne({
      tenantId,
      code: '5001', // Processing Expense
      allowPosting: true
    }).session(session);

    const cashPayableAccount = await ChartOfAccount.findOne({
      tenantId,
      code: '2001', // Accounts Payable
      allowPosting: true
    }).session(session);

    if (!riceInventoryAccount || !rawMaterialAccount) {
      throw new Error('Required COA accounts not found');
    }

    const entries = [];

    // Process each output and create separate DR entries
    for (const output of milling.outputs) {
      let accountId;
      let description;

      if (output.itemType === 'rice') {
        // DR Rice Inventory
        accountId = riceInventoryAccount._id;
        description = `Milling ${milling.batchNumber} - Rice produced`;
      } else {
        // DR Broken/Husk Inventory (Byproducts)
        accountId = byproductAccount ? byproductAccount._id : riceInventoryAccount._id;
        description = `Milling ${milling.batchNumber} - ${output.itemType} produced`;
      }

      entries.push({
        accountId,
        debit: output.allocatedCost,
        credit: 0,
        description
      });
    }

    // DR Processing Expense (if any)
    if (milling.processingCost > 0) {
      if (!processingExpenseAccount) {
        throw new Error('Processing expense account not found');
      }
      entries.push({
        accountId: processingExpenseAccount._id,
        debit: milling.processingCost,
        credit: 0,
        description: `Milling ${milling.batchNumber} - Processing expense`
      });
    }

    // CR Raw Material (Paddy)
    entries.push({
      accountId: rawMaterialAccount._id,
      debit: 0,
      credit: milling.input.totalCost,
      description: `Milling ${milling.batchNumber} - Raw material consumed`
    });

    // CR Cash / Payable (for processing cost)
    if (milling.processingCost > 0) {
      const payableAccountId = cashPayableAccount ? cashPayableAccount._id : rawMaterialAccount._id;
      entries.push({
        accountId: payableAccountId,
        debit: 0,
        credit: milling.processingCost,
        description: `Milling ${milling.batchNumber} - Processing cost payable`
      });
    }

    const journalResult = await JournalService.createJournal({
      tenantId,
      entries,
      reference: `MILL-${milling.batchNumber}`,
      description: `Milling: ${milling.input.quantity}kg paddy → ${milling.outputs.map(o => `${o.quantity}kg ${o.itemType}`).join(', ')}`,
      source: 'MILLING',
      sourceId: milling._id,
      createdBy: userId
    });

    // Calculate total output value for response
    const totalOutputValue = milling.outputs.reduce((sum, o) => sum + o.allocatedCost, 0);

    return {
      journalId: journalResult.journal._id,
      status: journalResult.journal.status,
      amount: totalOutputValue
    };
  } catch (error) {
    console.error('❌ Milling journal creation failed:', error.message);
    throw new Error(`Journal creation failed: ${error.message}`);
  }
}

/**
 * GET MILLING BY ID
 */
async function getMillingById(id, req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }

  return await Milling.findOne({
    _id: id,
    tenantId: req.tenantId,
    deletedAt: null
  }).populate('input.paddyItemId outputs.itemId');
}

/**
 * GET ALL MILLINGS
 */
async function getAllMillings(req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }

  return await Milling.find({
    tenantId: req.tenantId,
    deletedAt: null
  }).sort({ createdAt: -1 });
}

module.exports = {
  createMilling,
  getMillingById,
  getAllMillings
};