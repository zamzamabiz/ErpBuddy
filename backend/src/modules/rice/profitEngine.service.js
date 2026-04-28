const ProfitEngine = require('./profitEngine.model');
const RiceLot = require('./riceLot.model');

// Calculate profit after sale
exports.calculateProfit = async (lotId, tenantId, saleData) => {
  const lot = await RiceLot.findOne({ _id: lotId, tenantId });
  if (!lot) throw new Error('Lot not found');
  
  const soldWeight = lot.soldQuantity * lot.weightPerBag;
  const revenue = soldWeight * (lot.salePrice || 0);
  const costOfGoodsSold = soldWeight * (lot.totalCost / lot.totalWeight);
  const grossProfit = revenue - costOfGoodsSold;
  const grossMargin = (grossProfit / revenue) * 100;
  
  // Calculate net profit after expenses
  const netProfit = grossProfit - (saleData.brokerage || 0) - (saleData.transportCost || 0) - (saleData.otherExpenses || 0);
  const netMargin = (netProfit / revenue) * 100;
  
  const profitRecord = new ProfitEngine({
    tenantId,
    lotId: lot._id,
    lotNumber: lot.lotNumber,
    purchaseQuantity: lot.quantityBags,
    purchaseWeight: lot.totalWeight,
    purchaseRate: lot.purchaseRate,
    totalPurchaseCost: lot.totalCost,
    saleQuantity: lot.soldQuantity,
    saleWeight: soldWeight,
    saleRate: lot.salePrice,
    totalSaleRevenue: revenue,
    grossProfit,
    grossMargin,
    profitPerKg: grossProfit / soldWeight,
    moistureDeduction: saleData.moistureDeduction || 0,
    brokenDeduction: saleData.brokenDeduction || 0,
    gradePremium: saleData.gradePremium || 0,
    brokerage: saleData.brokerage || 0,
    transportCost: saleData.transportCost || 0,
    storageCost: saleData.storageCost || 0,
    otherExpenses: saleData.otherExpenses || 0,
    netProfit,
    netMargin,
    buyerName: saleData.buyerName || '',
    invoiceNumber: saleData.invoiceNumber || '',
    transactionDate: saleData.transactionDate || new Date()
  });
  
  await profitRecord.save();
  return profitRecord;
};

// Get profit summary for a lot
exports.getProfitSummary = async (lotId, tenantId) => {
  const profits = await ProfitEngine.find({ lotId, tenantId, isActive: true });
  const lot = await RiceLot.findOne({ _id: lotId, tenantId });
  
  if (!lot) throw new Error('Lot not found');
  
  const totalSold = lot.soldQuantity * lot.weightPerBag;
  const totalRevenue = totalSold * (lot.salePrice || 0);
  const totalCost = totalSold * (lot.totalCost / lot.totalWeight);
  
  return {
    lotNumber: lot.lotNumber,
    totalBags: lot.quantityBags,
    soldBags: lot.soldQuantity,
    remainingBags: lot.remainingQuantity,
    totalWeight: lot.totalWeight,
    soldWeight: totalSold,
    purchaseRate: lot.purchaseRate,
    saleRate: lot.salePrice || 0,
    totalPurchaseCost: lot.totalCost,
    totalRevenue,
    grossProfit: totalRevenue - totalCost,
    grossMargin: ((totalRevenue - totalCost) / totalRevenue) * 100,
    profitPerKg: (totalRevenue - totalCost) / totalSold,
    transactions: profits
  };
};

// Get dashboard profit summary (all lots)
exports.getDashboardProfit = async (tenantId) => {
  const lots = await RiceLot.find({ tenantId, isActive: true, soldQuantity: { $gt: 0 } });
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  
  lots.forEach(lot => {
    const soldWeight = lot.soldQuantity * lot.weightPerBag;
    const revenue = soldWeight * (lot.salePrice || 0);
    const cost = soldWeight * (lot.totalCost / lot.totalWeight);
    totalRevenue += revenue;
    totalCost += cost;
    totalProfit += (revenue - cost);
  });
  
  return {
    totalLots: lots.length,
    totalRevenue,
    totalCost,
    totalProfit,
    averageMargin: totalRevenue ? (totalProfit / totalRevenue) * 100 : 0
  };
};