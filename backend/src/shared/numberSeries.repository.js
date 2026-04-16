const NumberSeries = require('./numberSeries.model');

class NumberSeriesRepository {
  async findByCompanyAndModule(companyId, module) {
    return NumberSeries.findOne({ companyId, module });
  }

  async incrementAndGet(companyId, module) {
    // Atomic increment
    return NumberSeries.findOneAndUpdate(
      { companyId, module },
      { $inc: { lastNumber: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );
  }

  async createDefault(companyId, module, prefix, codeLength = 8) {
    return NumberSeries.create({ companyId, module, prefix, codeLength });
  }
}

module.exports = new NumberSeriesRepository();
