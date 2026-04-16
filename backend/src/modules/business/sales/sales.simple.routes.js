const express = require('express');
const router = express.Router();
const Sales = require('./sales.model');
const Item = require('../../item/item.model');
const { createJournalEntry } = require('../../accounting/journal.service');
const ChartOfAccount = require('../../accounting/coa.model');

// POST /api/sales/simple - Create sales
router.post('/simple', async (req, res) => {
  try {
    const { customerName, date, items, totalAmount } = req.body;
    
    if (!customerName || !date || !items || !totalAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check stock availability
    for (const item of items) {
      const dbItem = await Item.findById(item.itemId);
      if (!dbItem) {
        return res.status(400).json({ success: false, error: `Item ${item.itemName} not found` });
      }
      if (dbItem.currentStock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient stock for ${item.itemName}. Available: ${dbItem.currentStock}, Requested: ${item.quantity}` 
        });
      }
    }

    // Reduce stock and create movements
    const StockMovement = require('../../inventory/stockMovement.model');
    
    for (const item of items) {
      await Item.findByIdAndUpdate(
        item.itemId,
        { $inc: { currentStock: -item.quantity } }
      );

      // Create stock movement
      const movement = new StockMovement({
        itemId: item.itemId,
        type: 'SALE',
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        referenceId: sales._id,
        referenceType: 'SALES',
        description: `Sale to ${customerName}`,
        companyId: '69dd0cb31c5468a5b63511b7'
      });
      await movement.save();
    }

    const sales = new Sales({
      customerName,
      date,
      items,
      totalAmount,
      companyId: '69dd0cb31c5468a5b63511b7'
    });

    await sales.save();
    
    // Create accounting journal entries
    await createSalesJournalEntries(sales);
    
    res.json({ 
      success: true, 
      data: sales,
      message: 'Sales created with accounting entries'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sales/simple - Get all sales
router.get('/simple', async (req, res) => {
  try {
    const sales = await Sales.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * CREATE SALES JOURNAL ENTRIES
 */
async function createSalesJournalEntries(sales) {
  try {
    // Get COA accounts
    const receivableAccount = await ChartOfAccount.findOne({ code: '1002' }); // Accounts Receivable
    const revenueAccount = await ChartOfAccount.findOne({ code: '3001' }); // Sales Revenue
    const cogsAccount = await ChartOfAccount.findOne({ code: '4002' }); // Cost of Goods Sold
    const inventoryAccount = await ChartOfAccount.findOne({ code: '1001' }); // Inventory
    
    if (!receivableAccount || !revenueAccount || !cogsAccount || !inventoryAccount) {
      throw new Error('Required COA accounts not found');
    }

    // Calculate COGS (simplified: assume cost = 70% of sale price for demo)
    const cogsAmount = sales.totalAmount * 0.7;

    // Entry 1: Sales Revenue
    const revenueEntries = [
      {
        accountId: receivableAccount._id,
        debit: sales.totalAmount,
        credit: 0,
        description: `Sale to ${sales.customerName}`
      },
      {
        accountId: revenueAccount._id,
        debit: 0,
        credit: sales.totalAmount,
        description: `Revenue from ${sales.customerName}`
      }
    ];

    await createJournalEntry(
      revenueEntries,
      `SI-${sales._id}-REV`,
      `Sales to ${sales.customerName}`,
      'SALE',
      sales._id,
      sales.companyId
    );

    // Entry 2: COGS
    const cogsEntries = [
      {
        accountId: cogsAccount._id,
        debit: cogsAmount,
        credit: 0,
        description: `COGS for sale to ${sales.customerName}`
      },
      {
        accountId: inventoryAccount._id,
        debit: 0,
        credit: cogsAmount,
        description: `Inventory reduction for ${sales.customerName}`
      }
    ];

    await createJournalEntry(
      cogsEntries,
      `SI-${sales._id}-COGS`,
      `COGS for ${sales.customerName}`,
      'SALE',
      sales._id,
      sales.companyId
    );

    console.log(`✅ Sales accounting entries created for ${sales.customerName}`);
  } catch (error) {
    console.log('⚠️ Sales journal creation skipped:', error.message);
  }
}

module.exports = router;