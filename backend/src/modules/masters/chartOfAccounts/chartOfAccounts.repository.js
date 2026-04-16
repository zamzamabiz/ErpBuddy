const BaseRepository = require('@shared/base.repository');
const ChartOfAccounts = require('./chartOfAccounts.model');

class ChartOfAccountsRepository extends BaseRepository {
  constructor() {
    super(ChartOfAccounts);
  }
  // Add custom repository methods if needed
}

module.exports = new ChartOfAccountsRepository();
