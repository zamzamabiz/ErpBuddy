const BaseRepository = require('../../../shared/base.repository');
const Sales = require('./sales.model');

class SalesRepository extends BaseRepository {
  constructor() {
    super(Sales);
  }
  // Add custom repository methods if needed
}

module.exports = new SalesRepository();
