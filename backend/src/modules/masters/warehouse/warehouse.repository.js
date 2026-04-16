const BaseRepository = require('@shared/base.repository');
const Warehouse = require('./warehouse.model');

class WarehouseRepository extends BaseRepository {
  constructor() {
    super(Warehouse);
  }
  // Add custom repository methods if needed
}

module.exports = new WarehouseRepository();
