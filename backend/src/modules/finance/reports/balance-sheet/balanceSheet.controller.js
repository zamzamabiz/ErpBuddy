const balanceSheetService = require('./balanceSheet.service');

exports.getBalanceSheet = async (req, res, next) => {
  try {
    const { toDate } = req.query;
    const result = await balanceSheetService.getBalanceSheet({ toDate });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
