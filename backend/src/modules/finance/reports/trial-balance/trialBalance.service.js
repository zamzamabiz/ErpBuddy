const trialBalanceRepository = require('./trialBalance.repository');

class TrialBalanceService {
  async getTrialBalance(params) {
    // Validate date range
    let { fromDate, toDate } = params;
    if (fromDate) fromDate = new Date(fromDate);
    if (toDate) toDate = new Date(toDate);
    return trialBalanceRepository.getTrialBalance({ fromDate, toDate });
  }
}

module.exports = new TrialBalanceService();
