const BaseRepository = require('../../../shared/base.repository');
const InventoryTransaction = require('./inventoryTransaction.model');

class InventoryTransactionRepository extends BaseRepository {
  constructor() {
    super(InventoryTransaction);
  }

  // Add custom repository methods if needed
}

module.exports = new InventoryTransactionRepository();
