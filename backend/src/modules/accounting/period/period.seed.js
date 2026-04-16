const Period = require('./period.model');

const createDefaultPeriod = async (tenantId) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const existingPeriod = await Period.findOne({
      tenantId,
      startDate: { $lte: startDate },
      endDate: { $gte: endDate },
    });

    if (!existingPeriod) {
      const period = new Period({
        tenantId,
        startDate,
        endDate,
        isLocked: false,
      });

      await period.save();
      console.log(`Default period created for tenant ${tenantId}`);
    }
  } catch (err) {
    console.error('Error creating default period:', err.message);
  }
};

module.exports = { createDefaultPeriod };
