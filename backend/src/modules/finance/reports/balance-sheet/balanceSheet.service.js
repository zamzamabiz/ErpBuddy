const balanceSheetRepository = require('./balanceSheet.repository');

class BalanceSheetService {
  async getBalanceSheet(params) {
    let { toDate } = params;
    if (toDate) toDate = new Date(toDate);
    return balanceSheetRepository.getBalanceSheet({ toDate });
  }
}

module.exports = new BalanceSheetService();
