const profitLossService = require('./profitLoss.service');

exports.getProfitLoss = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const result = await profitLossService.getProfitLoss({ fromDate, toDate });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
