const Period = require('./period.model');

exports.getPeriods = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const periods = await Period.find({ tenantId }).sort({ startDate: 1 });
    res.status(200).json(periods);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch periods.', error: err.message });
  }
};

exports.lockPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const period = await Period.findOneAndUpdate(
      { _id: id, tenantId },
      {
        isLocked: true,
        lockedAt: new Date(),
      },
      { new: true }
    );

    if (!period) {
      return res.status(404).json({ message: 'Period not found.' });
    }

    res.status(200).json({ message: 'Period locked successfully.', period });
  } catch (err) {
    res.status(500).json({ message: 'Failed to lock period.', error: err.message });
  }
};

exports.unlockPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const period = await Period.findOneAndUpdate(
      { _id: id, tenantId },
      {
        isLocked: false,
        lockedAt: null,
      },
      { new: true }
    );

    if (!period) {
      return res.status(404).json({ message: 'Period not found.' });
    }

    res.status(200).json({ message: 'Period unlocked successfully.', period });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unlock period.', error: err.message });
  }
};
