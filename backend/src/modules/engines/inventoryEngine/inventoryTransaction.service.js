const BaseService = require('../../../shared/base.service');
const InventoryTransactionRepository = require('./inventoryTransaction.repository');

class InventoryTransactionService extends BaseService {
  constructor() {
    super(InventoryTransactionRepository);
  }

  // Calculate stock balance per item+warehouse
  async getStockBalance({ company, item, warehouse }) {
    const pipeline = [
      { $match: { company, item, warehouse } },
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

  // Add more inventory logic as needed
}

module.exports = new InventoryTransactionService();
