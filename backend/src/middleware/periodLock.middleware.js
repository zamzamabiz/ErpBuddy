const Period = require('../modules/accounting/period/period.model');

const periodLock = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const transactionDate = req.body.date || req.body.transactionDate || req.body.invoiceDate;

    if (!transactionDate) {
      return next();
    }

    const period = await Period.findOne({
      tenantId,
      startDate: { $lte: new Date(transactionDate) },
      endDate: { $gte: new Date(transactionDate) },
    });

    if (period && period.isLocked) {
      return res.status(403).json({
        message: 'Period is locked. Operation not allowed.',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: 'Period lock check failed.', error: err.message });
  }
};

module.exports = periodLock;