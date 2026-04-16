const BaseRepository = require('@shared/base.repository');
const Currency = require('./currency.model');

class CurrencyRepository extends BaseRepository {
  constructor() {
    super(Currency);
  }
  // Add custom repository methods if needed
}

module.exports = new CurrencyRepository();
