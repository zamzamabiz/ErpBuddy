const profitLossRepository = require('./profitLoss.repository');

class ProfitLossService {
  async getProfitLoss(params) {
    let { fromDate, toDate } = params;
    if (fromDate) fromDate = new Date(fromDate);
    if (toDate) toDate = new Date(toDate);
    return profitLossRepository.getProfitLoss({ fromDate, toDate });
  }
}

module.exports = new ProfitLossService();
