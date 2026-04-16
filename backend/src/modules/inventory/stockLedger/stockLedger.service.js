const StockLedger = require('./stockLedger.model');

class StockLedgerService {

  // 🔴 Create Entry
  async createEntry(data) {
    const lastEntry = await StockLedger.findOne({
      itemId: data.itemId,
      warehouseId: data.warehouseId,
    }).sort({ createdAt: -1 });

    const previousBalance = lastEntry ? lastEntry.balanceQty : 0;

    const newBalance =
      previousBalance + (data.qtyIn || 0) - (data.qtyOut || 0);

    const entry = await StockLedger.create({
      ...data,
      balanceQty: newBalance,
    });

    return entry;
  }

  // 🔴 Get Stock Balance
  async getStock(itemId, warehouseId) {
    const lastEntry = await StockLedger.findOne({
      itemId,
      warehouseId,
    }).sort({ createdAt: -1 });

    return lastEntry ? lastEntry.balanceQty : 0;
  }

}

module.exports = new StockLedgerService();
