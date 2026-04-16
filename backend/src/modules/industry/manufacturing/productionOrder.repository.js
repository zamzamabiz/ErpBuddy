const BaseRepository = require('../../../shared/base.repository');
const ProductionOrder = require('./productionOrder.model');

class ProductionOrderRepository extends BaseRepository {
  constructor() {
    super(ProductionOrder);
  }
  // Add custom repository methods if needed
}

module.exports = new ProductionOrderRepository();
