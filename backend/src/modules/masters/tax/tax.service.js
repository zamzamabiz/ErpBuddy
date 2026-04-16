const BaseService = require('@shared/base.service');
const taxRepository = require('./tax.repository');

class TaxService extends BaseService {
  constructor() {
    super(taxRepository);
  }
  // Add custom service methods if needed
}

module.exports = new TaxService();
