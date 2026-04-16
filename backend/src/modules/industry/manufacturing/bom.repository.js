const BaseRepository = require('../../../shared/base.repository');
const BOM = require('./bom.model');

class BOMRepository extends BaseRepository {
  constructor() {
    super(BOM);
  }
  // Add custom repository methods if needed
}

module.exports = new BOMRepository();
