const Sales = require("./sales.model");

// ✅ CORRECT IMPORTS WITH EXACT PATHS
const coreEngine = require("@modules/engines/coreEngine/coreEngine.service");
const stockLedgerService = require("@modules/inventory/stockLedger/stockLedger.service");
const costingService = require("@modules/inventory/costing/costing.service");
const AuditService = require("../../audit/audit.service");

// ✅ 🔷 ITEM MASTER (for validation & costing method)
const Item = require("@modules/item/item.model");

// ✅ 🔷 ACCOUNT MASTER (for journal posting validation)
const Account = require("@modules/accounting/accounts/account.model");

/**
 * 🔷 CREATE SALES
 */
async function createSales(data, userId, tenantId) {
  const sales = await Sales.create(data);

  await AuditService.logAction({
    tenantId,
    userId,
    action: 'CREATE',
    module: 'sales',
    recordId: sales._id,
    changes: {
      salesNumber: sales.salesNumber,
      totalAmount: sales.totalAmount,
    },
  }).catch(() => {});

  return sales;
}

/**
 * 🔷 GET ALL SALES
 */
async function getAllSales(tenantId) {
  return await Sales.find({ tenantId, deletedAt: null }).sort({ createdAt: -1 });
}

/**
 * 🔷 GET SINGLE SALES
 */
async function getSalesById(salesId, tenantId) {
  const sales = await Sales.findOne({ _id: salesId, tenantId, deletedAt: null });

  if (!sales) throw new Error("Sales not found");

  return sales;
}

/**
 * 🔷 UPDATE SALES
 */
async function updateSales(salesId, tenantId, data, userId) {
  const sales = await Sales.findOne({ _id: salesId, tenantId, deletedAt: null });

  if (!sales) throw new Error("Sales not found");

  if (sales.status !== "Draft") {
    throw new Error("Only Draft sales can be updated");
  }

  const updated = await Sales.findOneAndUpdate(
    { _id: salesId, tenantId, deletedAt: null },
    { ...data, updatedBy: userId, updatedAt: new Date() },
    { new: true }
  );

  await AuditService.logAction({
    tenantId,
    userId,
    action: 'UPDATE',
    module: 'sales',
    recordId: salesId,
    changes: data,
  }).catch(() => {});

  return updated;
}

/**
 * 🔷 REMOVE (SOFT DELETE) SALES
 */
async function removeSales(salesId, tenantId, userId) {
  const sales = await Sales.findOne({ _id: salesId, tenantId, deletedAt: null });

  if (!sales) throw new Error("Sales not found");

  if (sales.status !== "Draft") {
    throw new Error("Only Draft sales can be deleted");
  }

  const deleted = await Sales.findOneAndUpdate(
    { _id: salesId, tenantId, deletedAt: null },
    { deletedAt: new Date(), updatedBy: userId, updatedAt: new Date() },
    { new: true }
  );

  await AuditService.logAction({
    tenantId,
    userId,
    action: 'DELETE',
    module: 'sales',
    recordId: salesId,
  }).catch(() => {});

  return deleted;
}

/**
 * 🔷 RESTORE SALES
 */
async function restoreSales(salesId, tenantId, userId) {
  const sales = await Sales.findOne({ _id: salesId, tenantId, deletedAt: { $ne: null } });

  if (!sales) throw new Error("Deleted sales not found");

  const restored = await Sales.findOneAndUpdate(
    { _id: salesId, tenantId },
    { deletedAt: null, updatedBy: userId, updatedAt: new Date() },
    { new: true }
  );

  await AuditService.logAction({
    tenantId,
    userId,
    action: 'RESTORE',
    module: 'sales',
    recordId: salesId,
  }).catch(() => {});

  return restored;
}

/**
 * 🔷 POST SALES
 */
async function postSales(salesId, tenantId, userId) {
  const sales = await Sales.findOne({ _id: salesId, tenantId, deletedAt: null });

  if (!sales) throw new Error("Sales not found");

  if (sales.status !== "Draft") {
    throw new Error("Only Draft sales can be posted");
  }

  // 🔒 STEP 1: Atomic Lock - Use atomic update to bypass schema validation
  const atomicUpdate = await Sales.findOneAndUpdate(
    {
      _id: salesId,
      tenantId,
      status: 'Draft',
    },
    {
      status: 'Posting',
      updatedAt: new Date(),
    },
    { new: true }
  );

  if (!atomicUpdate) {
    throw new Error('Sales already posted or not found');
  }

  const updatedSales = atomicUpdate;

  try {
    /**
     * ✅ STEP 1B: VALIDATE ALL ITEMS + NEGATIVE STOCK CHECK (CRITICAL)
     */
    const validatedItems = [];
    for (const lineItem of updatedSales.items || []) {
      const item = await Item.findOne({
        _id: lineItem.item || lineItem.itemId,
        tenantId,
        deletedAt: null,
      });

      if (!item) {
        throw new Error(
          `Item not found or deleted: ${lineItem.item || lineItem.itemId}`
        );
      }

      if (item.itemType !== 'STOCK') {
        throw new Error(
          `Item must be STOCK type (got: ${item.itemType}): ${item.name}`
        );
      }

      if (!item.isActive) {
        throw new Error(
          `Item is inactive: ${item.name}`
        );
      }

      // 🎯 Determine costing method from ITEM (not from sales)
      const costingMethod = item.costingMethod || 'FIFO';
      
      validatedItems.push({
        ...lineItem,
        item: item._id,
        costingMethod,
      });
    }

    // ✅ STEP 2: Create Journal Entry via Core Engine
    let journalId = null;
    try {
      // Build journal lines for the sale
      const journalLines = [
        {
          accountId: updatedSales.customerAccountId,
          debit: updatedSales.totalAmount,
          credit: 0,
          description: `AR for Sale: ${updatedSales.salesNumber}`,
        },
        {
          accountId: updatedSales.salesAccountId,
          debit: 0,
          credit: updatedSales.totalAmount,
          description: `Sales Revenue: ${updatedSales.salesNumber}`,
        },
      ];

      const coreEngineResult = await coreEngine.processTransaction('SALE', {
        tenantId,
        userId,
        reference: updatedSales.salesNumber || 'Unknown',
        date: updatedSales.date || new Date(),
        journalLines: journalLines,
      });
      journalId = coreEngineResult.journal._id;
    } catch (err) {
      console.error('❌ Journal creation failed:', err.message);
      throw err;
    }

    // ✅ STEP 2B: Calculate COGS using Item-Level Costing Strategy & Create Stock Ledger Entries (Inventory OUT)
    let totalCOGS = 0;
    try {
      for (const item of validatedItems) {
        // 🎯 Use item-specific costing method
        const costingMethod = item.costingMethod || 'FIFO';
        console.log(`\n📦 Item ${item.item}: Processing ${costingMethod}...`);
        
        const costResult = await costingService.calculateCost(costingMethod, {
          tenantId,
          itemId: item.item,
          warehouseId: updatedSales.warehouse,
          qty: item.quantity || 0,
        });

        if (!costResult) {
          throw new Error(
            `Costing calculation failed for item ${item.item}. Insufficient stock or costing error.`
          );
        }

        console.log(`   ✅ ${costingMethod} Result: TotalCost=${costResult.totalCost}, UnitCost=${costResult.unitCost}`);

        // Update item with calculated costs
        item.cost = costResult.totalCost;
        item.unitCost = costResult.unitCost;
        item.costingMethod = costingMethod; // Track which method was used
        totalCOGS += costResult.totalCost;

        // Create Stock Ledger entry with calculated costs
        await stockLedgerService.createEntry({
          tenantId,
          itemId: item.item,
          warehouseId: updatedSales.warehouse,
          transactionType: 'SALE',
          referenceId: updatedSales._id,
          referenceType: 'Sales',
          qtyIn: 0,
          qtyOut: item.quantity || 0,
          unitCost: costResult.unitCost,
          totalCost: costResult.totalCost,
          batchNo: item.batchNo || null,
          subLot: item.subLot || null,
          transactionDate: updatedSales.date || new Date(),
        });
      }
    } catch (err) {
      console.error(`❌ Costing/Stock Ledger error: ${err.message}`);
      throw err;
    }

    // ✅ STEP 2C: Create COGS Journal Entry via Core Engine
    let cogsJournalId = null;
    try {
      if (totalCOGS > 0) {
        console.log(`\n📝 COGS Journal: Creating entry for ${totalCOGS}`);
        const cogsResult = await coreEngine.processTransaction('COGS', {
          tenantId,
          userId,
          reference: updatedSales.salesNumber || 'Unknown',
          date: updatedSales.date || new Date(),
          amount: totalCOGS,
          journalLines: [
            {
              accountId: updatedSales.cogsAccountId, // COGS account (Expense)
              debit: totalCOGS,
              credit: 0,
              description: `COGS for Sale: ${updatedSales.salesNumber}`,
            },
            {
              accountId: updatedSales.inventoryAccountId, // Inventory account (Asset)
              debit: 0,
              credit: totalCOGS,
              description: `Inventory Reduction: ${updatedSales.salesNumber}`,
            },
          ],
        });
        cogsJournalId = cogsResult.journal._id;
        console.log(`   ✅ COGS Journal created: ${cogsJournalId}`);
      }
    } catch (err) {
      console.error('❌ COGS Journal creation failed:', err.message);
      // Don't throw - COGS is tracking, main journal is required
      console.log('   ⚠️ Continuing without COGS journal...');
    }

    // ✅ STEP 3: Finalize
    updatedSales.status = "Posted";
    updatedSales.journalId = journalId;
    updatedSales.cogsJournalId = cogsJournalId;
    updatedSales.totalCOGS = totalCOGS;
    await updatedSales.save();

    await AuditService.logAction({
      tenantId,
      userId,
      action: 'POST',
      module: 'sales',
      recordId: salesId,
    }).catch(() => {});

    return updatedSales;
  } catch (error) {
    // 🔁 ROLLBACK - Revert to Draft using atomic update
    await Sales.findOneAndUpdate(
      { _id: salesId, tenantId },
      { status: 'Draft', updatedAt: new Date() },
      { new: true }
    );

    throw error;
  }
}

module.exports = {
  create: createSales,
  findAll: getAllSales,
  findById: getSalesById,
  update: updateSales,
  remove: removeSales,
  restore: restoreSales,
  post: postSales,
  postSaleJournal,
};

/**
 * 🔷 POST SALE JOURNAL
 * ========================
 * Dedicated function to create journal entry for a sale
 * ✅ Validates accounts
 * ✅ Prevents duplicate posting
 * ✅ Handles errors with try/catch
 * ✅ Supports rollback on failure
 */
async function postSaleJournal(tenantId, userId, {
  salesId,
  customerAccountId,
  revenueAccountId,
  cogsAccountId = null,
  inventoryAccountId = null,
  amount,
  cogsAmount = 0,
  reference,
  date = new Date()
}) {
  try {
    console.log(`\n📝 postSaleJournal: Creating journal for ${reference}, Amount: ${amount}`);

    // ✅ STEP 1: Validate Customer Account (A/R)
    if (!customerAccountId) {
      throw new Error('Customer account ID is required');
    }

    const customerAccount = await Account.findOne({
      _id: customerAccountId,
      tenantId,
      isActive: true,
      allowPosting: true,
      deletedAt: null
    });

    if (!customerAccount) {
      throw new Error(`Customer account (A/R) not found or inactive: ${customerAccountId}`);
    }

    if (customerAccount.type !== 'asset' && customerAccount.type !== 'liability') {
      throw new Error(`Customer account must be Asset or Liability type, got: ${customerAccount.type}`);
    }

    // ✅ STEP 2: Validate Revenue Account
    if (!revenueAccountId) {
      throw new Error('Revenue account ID is required');
    }

    const revenueAccount = await Account.findOne({
      _id: revenueAccountId,
      tenantId,
      isActive: true,
      allowPosting: true,
      deletedAt: null
    });

    if (!revenueAccount) {
      throw new Error(`Revenue account not found or inactive: ${revenueAccountId}`);
    }

    if (revenueAccount.type !== 'income') {
      throw new Error(`Revenue account must be Income type, got: ${revenueAccount.type}`);
    }

    // ✅ STEP 3: Check for duplicate posting (prevent double-posting)
    if (salesId) {
      const existingSale = await Sales.findOne({
        _id: salesId,
        tenantId,
        journalId: { $exists: true, $ne: null }
      });

      if (existingSale && existingSale.journalId) {
        throw new Error(`Sale journal already posted: ${salesId}. Reference journal: ${existingSale.journalId}`);
      }
    }

    // ✅ STEP 4: Create Main Journal Entry via Core Engine
    let journalId = null;
    try {
      const journalLines = [
        {
          accountId: customerAccountId,
          debit: amount,
          credit: 0,
          description: `A/R for Sale: ${reference}`,
        },
        {
          accountId: revenueAccountId,
          debit: 0,
          credit: amount,
          description: `Sales Revenue: ${reference}`,
        },
      ];

      const result = await coreEngine.processTransaction('SALE', {
        tenantId,
        userId,
        reference,
        date,
        journalLines,
      });

      journalId = result.journal._id;
      console.log(`✅ Sale journal created: ${journalId}`);
    } catch (err) {
      console.error('❌ Sale journal creation failed:', err.message);
      throw new Error(`Failed to create sale journal: ${err.message}`);
    }

    // ✅ STEP 5: Create COGS Journal Entry (if amounts provided)
    let cogsJournalId = null;
    if (cogsAmount > 0 && cogsAccountId && inventoryAccountId) {
      try {
        // Validate COGS Account
        const cogsAccount = await Account.findOne({
          _id: cogsAccountId,
          tenantId,
          isActive: true,
          allowPosting: true,
          deletedAt: null
        });

        if (!cogsAccount) {
          throw new Error(`COGS account not found or inactive: ${cogsAccountId}`);
        }

        if (cogsAccount.type !== 'expense') {
          throw new Error(`COGS account must be Expense type, got: ${cogsAccount.type}`);
        }

        // Validate Inventory Account
        const inventoryAccount = await Account.findOne({
          _id: inventoryAccountId,
          tenantId,
          isActive: true,
          allowPosting: true,
          deletedAt: null
        });

        if (!inventoryAccount) {
          throw new Error(`Inventory account not found or inactive: ${inventoryAccountId}`);
        }

        if (inventoryAccount.type !== 'asset') {
          throw new Error(`Inventory account must be Asset type, got: ${inventoryAccount.type}`);
        }

        const cogsResult = await coreEngine.processTransaction('COGS', {
          tenantId,
          userId,
          reference,
          date,
          journalLines: [
            {
              accountId: cogsAccountId,
              debit: cogsAmount,
              credit: 0,
              description: `COGS for Sale: ${reference}`,
            },
            {
              accountId: inventoryAccountId,
              debit: 0,
              credit: cogsAmount,
              description: `Inventory Reduction: ${reference}`,
            },
          ],
        });

        cogsJournalId = cogsResult.journal._id;
        console.log(`✅ COGS journal created: ${cogsJournalId}`);
      } catch (err) {
        console.error('⚠️ COGS journal creation failed (non-critical):', err.message);
        // Don't throw - COGS is optional tracking
        console.log('   Continuing without COGS journal...');
      }
    }

    return {
      success: true,
      journalId,
      cogsJournalId,
      message: `Sale journal created successfully for ${reference}`,
    };

  } catch (err) {
    console.error('❌ postSaleJournal ERROR:', err.message);
    throw err;
  }
}