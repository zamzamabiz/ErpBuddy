const cashFlowService = require('./cashFlow.service');

exports.getCashFlow = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const result = await cashFlowService.getCashFlow({ fromDate, toDate });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
