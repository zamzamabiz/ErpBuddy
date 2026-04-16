const BaseService = require('@shared/base.service');
const currencyRepository = require('./currency.repository');

class CurrencyService extends BaseService {
  constructor() {
    super(currencyRepository);
  }
  // Add custom service methods if needed
}

module.exports = new CurrencyService();
