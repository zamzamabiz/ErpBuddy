const BaseService = require('@shared/base.service');
const chartOfAccountsRepository = require('./chartOfAccounts.repository');

class ChartOfAccountsService extends BaseService {
  constructor() {
    super(chartOfAccountsRepository);
  }
  // Add custom service methods if needed
}

module.exports = new ChartOfAccountsService();
