const BaseRepository = require('@shared/base.repository');
const Tax = require('./tax.model');

class TaxRepository extends BaseRepository {
  constructor() {
    super(Tax);
  }
  // Add custom repository methods if needed
}

module.exports = new TaxRepository();
