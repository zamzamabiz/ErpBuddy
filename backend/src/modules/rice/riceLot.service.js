const RiceLot = require('./riceLot.model');

exports.createLot = async (lotData) => {
  const lot = new RiceLot(lotData);
  await lot.save();
  return lot;
};

exports.getAllLots = async (tenantId, query = {}) => {
  const filter = { tenantId, isActive: true };
  if (query.status) filter.status = query.status;
  if (query.grade) filter.grade = query.grade;
  return RiceLot.find(filter).sort({ createdAt: -1 });
};

exports.getLotById = async (id, tenantId) => {
  return RiceLot.findOne({ _id: id, tenantId, isActive: true });
};

exports.updateLot = async (id, tenantId, updateData) => {
  return RiceLot.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
};

exports.deleteLot = async (id, tenantId) => {
  return RiceLot.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    { isActive: false, updatedAt: Date.now() },
    { new: true }
  );
};

exports.getAvailableLots = async (tenantId) => {
  return RiceLot.find({ 
    tenantId, 
    isActive: true, 
    status: { $in: ['in-stock', 'partial'] },
    remainingQuantity: { $gt: 0 }
  }).sort({ createdAt: -1 });
};

exports.sellFromLot = async (id, tenantId, quantity) => {
  const lot = await RiceLot.findOne({ _id: id, tenantId, isActive: true });
  if (!lot) throw new Error('Lot not found');
  if (lot.remainingQuantity < quantity) throw new Error('Insufficient stock');
  
  lot.soldQuantity += quantity;
  lot.remainingQuantity = lot.quantityBags - lot.soldQuantity;
  lot.status = lot.remainingQuantity === 0 ? 'sold' : 'partial';
  await lot.save();
  return lot;
};

// Sales integration - reserve stock for a sale
exports.reserveForSale = async (lotId, tenantId, quantity) => {
  const lot = await RiceLot.findOne({ _id: lotId, tenantId, isActive: true });
  if (!lot) throw new Error('Lot not found');
  if (lot.remainingQuantity < quantity) throw new Error('Insufficient stock');
  
  lot.reservedQuantity = (lot.reservedQuantity || 0) + quantity;
  await lot.save();
  return lot;
};

// Sales integration - confirm sale (move from reserved to sold)
exports.confirmSale = async (lotId, tenantId, quantity, salePrice) => {
  const lot = await RiceLot.findOne({ _id: lotId, tenantId, isActive: true });
  if (!lot) throw new Error('Lot not found');
  if ((lot.reservedQuantity || 0) < quantity) throw new Error('Insufficient reservation');
  
  lot.reservedQuantity -= quantity;
  lot.soldQuantity += quantity;
  lot.remainingQuantity = lot.quantityBags - lot.soldQuantity;
  lot.status = lot.remainingQuantity === 0 ? 'sold' : 'partial';
  
  // Track sale price for profit calculation
  lot.salePrice = salePrice;
  lot.profitPerUnit = salePrice - (lot.totalCost / lot.totalWeight);
  
  await lot.save();
  return lot;
};

// Get lot profit summary
exports.getLotProfit = async (lotId, tenantId) => {
  const lot = await RiceLot.findOne({ _id: lotId, tenantId });
  if (!lot) throw new Error('Lot not found');
  
  return {
    lotId: lot._id,
    lotNumber: lot.lotNumber,
    totalCost: lot.totalCost,
    totalWeight: lot.totalWeight,
    costPerKg: lot.totalCost / lot.totalWeight,
    soldQuantity: lot.soldQuantity,
    soldWeight: lot.soldQuantity * lot.weightPerBag,
    revenue: (lot.soldQuantity * lot.weightPerBag) * (lot.salePrice || 0),
    profit: (lot.soldQuantity * lot.weightPerBag) * (lot.salePrice || 0) - (lot.soldQuantity * lot.weightPerBag * (lot.totalCost / lot.totalWeight))
  };
};
