const trialBalanceService = require('./trialBalance.service');

exports.getTrialBalance = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const result = await trialBalanceService.getTrialBalance({ fromDate, toDate });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
