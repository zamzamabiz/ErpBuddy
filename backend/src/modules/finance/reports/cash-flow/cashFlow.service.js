const cashFlowRepository = require('./cashFlow.repository');

class CashFlowService {
  async getCashFlow(params) {
    let { fromDate, toDate } = params;
    if (fromDate) fromDate = new Date(fromDate);
    if (toDate) toDate = new Date(toDate);
    return cashFlowRepository.getCashFlow({ fromDate, toDate });
  }
}

module.exports = new CashFlowService();
