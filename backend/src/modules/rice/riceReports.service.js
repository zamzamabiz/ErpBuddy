const RiceLot = require('./riceLot.model');

// Stock Report - Current inventory
exports.getStockReport = async (tenantId) => {
  const lots = await RiceLot.find({ tenantId, isActive: true });
  return lots.map(lot => ({
    lotNumber: lot.lotNumber,
    grade: lot.grade,
    remainingBags: lot.remainingQuantity,
    remainingWeight: lot.remainingQuantity * lot.weightPerBag,
    avgCost: lot.purchaseRate
  }));
};

// Profit & Loss Report
exports.getProfitLossReport = async (tenantId) => {
  const lots = await RiceLot.find({ tenantId, soldQuantity: { $gt: 0 } });
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalBrokerage = 0;
  let totalTransport = 0;
  
  lots.forEach(lot => {
    const soldWeight = lot.soldQuantity * lot.weightPerBag;
    totalRevenue += soldWeight * (lot.salePrice || 0);
    totalCost += soldWeight * lot.purchaseRate;
    totalBrokerage += lot.brokerage || 0;
    totalTransport += lot.transportCost || 0;
  });
  
  return {
    totalRevenue,
    totalCost,
    totalGrossProfit: totalRevenue - totalCost,
    totalExpenses: totalBrokerage + totalTransport,
    totalNetProfit: (totalRevenue - totalCost) - (totalBrokerage + totalTransport),
    totalBrokerage,
    totalTransport
  };
};

// Lot Performance Report
exports.getLotPerformance = async (tenantId) => {
  const lots = await RiceLot.find({ tenantId, soldQuantity: { $gt: 0 } });
  
  return lots.map(lot => {
    const soldWeight = lot.soldQuantity * lot.weightPerBag;
    const revenue = soldWeight * (lot.salePrice || 0);
    const cost = soldWeight * lot.purchaseRate;
    const grossProfit = revenue - cost;
    const expenses = (lot.brokerage || 0) + (lot.transportCost || 0);
    const netProfit = grossProfit - expenses;
    
    return {
      lotNumber: lot.lotNumber,
      grade: lot.grade,
      soldBags: lot.soldQuantity,
      soldWeight,
      revenue,
      cost,
      grossProfit,
      expenses,
      netProfit,
      margin: revenue > 0 ? (netProfit / revenue) * 100 : 0
    };
  });
};

// Dashboard Summary
exports.getDashboardReport = async (tenantId) => {
  const stockReport = await exports.getStockReport(tenantId);
  const pnlReport = await exports.getProfitLossReport(tenantId);
  const performance = await exports.getLotPerformance(tenantId);
  
  const totalStockWeight = stockReport.reduce((sum, s) => sum + s.remainingWeight, 0);
  const totalStockValue = stockReport.reduce((sum, s) => sum + (s.remainingWeight * s.avgCost), 0);
  
  return {
    summary: {
      totalRevenue: pnlReport.totalRevenue || 0,
      totalGrossProfit: pnlReport.totalGrossProfit || 0,
      totalExpenses: pnlReport.totalExpenses || 0,
      totalNetProfit: pnlReport.totalNetProfit || 0,
      overallMargin: pnlReport.totalRevenue ? (pnlReport.totalNetProfit / pnlReport.totalRevenue) * 100 : 0
    },
    inventory: {
      activeLots: stockReport.length,
      totalStockWeight,
      totalStockValue
    },
    topPerformingLots: performance.sort((a, b) => b.netProfit - a.netProfit).slice(0, 5)
  };
};