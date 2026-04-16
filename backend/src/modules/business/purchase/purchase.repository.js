const BaseRepository = require('../../../shared/base.repository');
const Purchase = require('./purchase.model');

class PurchaseRepository extends BaseRepository {
  constructor() {
    super(Purchase);
  }
  // Add custom repository methods if needed
}

module.exports = new PurchaseRepository();
