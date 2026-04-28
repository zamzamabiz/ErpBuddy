const Sales = require('@modules/business/sales/sales.model');
const Expense = require('@modules/finance/expense/expense.model');
const mongoose = require('mongoose');

/**
 * PROFIT SERVICE
 * Calculates profit from sales and expenses
 * 
 * FORMULA: Profit = Sales - COGS - Expenses
 */

/**
 * GET PROFIT BY SALE
 * Returns detailed profit calculation for a single sale
 */
async function getProfitBySale(saleId, req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;

  // 1. Fetch the sale
  const sale = await Sales.findOne({
    _id: saleId,
    tenantId,
    deletedAt: null
  });

  if (!sale) {
    throw new Error('Sale not found');
  }

  // 2. Get linked expenses
  const expenses = await Expense.find({
    tenantId,
    referenceId: saleId,
    referenceType: 'SALE',
    deletedAt: null
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 3. Calculate profit
  const salesAmount = sale.netAmount || sale.totalAmount || 0;
  const cogs = sale.totalCOGS || 0;
  const profit = salesAmount - cogs - totalExpenses;

  return {
    saleId,
    salesNumber: sale.salesNumber,
    salesDate: sale.salesDate,
    salesAmount,
    cogs,
    expenses: totalExpenses,
    expenseBreakdown: expenses.map(exp => ({
      type: exp.expenseType,
      amount: exp.amount,
      description: exp.description
    })),
    profit,
    profitMargin: salesAmount > 0 ? (profit / salesAmount * 100) : 0
  };
}

/**
 * GET OVERALL PROFIT SUMMARY
 * Returns aggregated profit for a date range
 */
async function getOverallProfit(req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const companyId = req.companyId || tenantId;

  // Parse date filters
  const { fromDate, toDate } = req.query;
  const dateFilter = {};
  
  if (fromDate || toDate) {
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);
  }

  // 1. Get all posted sales
  const salesFilter = {
    tenantId,
    companyId,
    status: 'Posted',
    deletedAt: null
  };
  
  if (Object.keys(dateFilter).length > 0) {
    salesFilter.salesDate = dateFilter;
  }

  const sales = await Sales.find(salesFilter);

  const totalSales = sales.reduce((sum, sale) => sum + (sale.netAmount || sale.totalAmount || 0), 0);
  const totalCOGS = sales.reduce((sum, sale) => sum + (sale.totalCOGS || 0), 0);

  // 2. Get all expenses
  const expenseFilter = {
    tenantId,
    companyId,
    status: 'Posted',
    deletedAt: null
  };

  if (Object.keys(dateFilter).length > 0) {
    expenseFilter.expenseDate = dateFilter;
  }

  const expenses = await Expense.find(expenseFilter);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 3. Calculate profit
  const netProfit = totalSales - totalCOGS - totalExpenses;

  // 4. Group expenses by type
  const expenseByType = {};
  expenses.forEach(exp => {
    if (!expenseByType[exp.expenseType]) {
      expenseByType[exp.expenseType] = 0;
    }
    expenseByType[exp.expenseType] += exp.amount;
  });

  return {
    period: {
      fromDate: fromDate || null,
      toDate: toDate || null
    },
    summary: {
      totalSales,
      totalCOGS,
      totalExpenses,
      netProfit,
      grossProfit: totalSales - totalCOGS,
      profitMargin: totalSales > 0 ? (netProfit / totalSales * 100) : 0
    },
    expenseBreakdown: expenseByType,
    salesCount: sales.length,
    expenseCount: expenses.length
  };
}

/**
 * GET PROFIT BY ITEM
 * Returns profit analysis by item
 */
async function getProfitByItem(req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const companyId = req.companyId || tenantId;

  const { fromDate, toDate } = req.query;
  const dateFilter = {};
  
  if (fromDate) dateFilter.$gte = new Date(fromDate);
  if (toDate) dateFilter.$lte = new Date(toDate);

  // Get sales with items
  const salesFilter = {
    tenantId,
    companyId,
    status: 'Posted',
    deletedAt: null
  };
  
  if (Object.keys(dateFilter).length > 0) {
    salesFilter.salesDate = dateFilter;
  }

  const sales = await Sales.find(salesFilter).populate('items.item');

  // Aggregate by item
  const itemProfits = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      const itemId = item.item ? item.item._id : item.item;
      const itemName = item.item ? item.item.name : 'Unknown';
      
      if (!itemProfits[itemId]) {
        itemProfits[itemId] = {
          itemId,
          itemName,
          totalSales: 0,
          totalCOGS: 0,
          quantity: 0
        };
      }

      itemProfits[itemId].totalSales += item.totalPrice || 0;
      itemProfits[itemId].totalCOGS += item.cost || 0;
      itemProfits[itemId].quantity += item.quantity || 0;
    });
  });

  // Calculate profit for each item
  const result = Object.values(itemProfits).map(item => ({
    ...item,
    profit: item.totalSales - item.totalCOGS,
    profitMargin: item.totalSales > 0 ? ((item.totalSales - item.totalCOGS) / item.totalSales * 100) : 0,
    avgCostPerUnit: item.quantity > 0 ? item.totalCOGS / item.quantity : 0,
    avgPricePerUnit: item.quantity > 0 ? item.totalSales / item.quantity : 0
  }));

  return {
    period: {
      fromDate: fromDate || null,
      toDate: toDate || null
    },
    items: result.sort((a, b) => b.profit - a.profit)
  };
}

module.exports = {
  getProfitBySale,
  getOverallProfit,
  getProfitByItem
};