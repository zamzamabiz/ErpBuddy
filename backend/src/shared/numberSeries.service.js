const NumberSeriesRepository = require('./numberSeries.repository');

const MODULE_PREFIXES = {
  customers: '11',
  suppliers: '12',
  items: '13',
  warehouse: '14',
  chartOfAccounts: '15',
  employees: '16',
  assets: '17',
};

class NumberSeriesService {
  async generateMasterCode(companyId, module) {
    // Ensure number series exists
    let series = await NumberSeriesRepository.findByCompanyAndModule(companyId, module);
    if (!series) {
      const prefix = MODULE_PREFIXES[module];
      if (!prefix) throw new Error('Invalid module for code generation');
      series = await NumberSeriesRepository.createDefault(companyId, module, prefix);
    }
    // Atomic increment
    const updated = await NumberSeriesRepository.incrementAndGet(companyId, module);
    const code = `${updated.prefix}${String(updated.lastNumber).padStart(6, '0')}`;
    return code;
  }

  async seedDefaults(companyId) {
    for (const [module, prefix] of Object.entries(MODULE_PREFIXES)) {
      let exists = await NumberSeriesRepository.findByCompanyAndModule(companyId, module);
      if (!exists) {
        await NumberSeriesRepository.createDefault(companyId, module, prefix);
      }
    }
  }
}

module.exports = new NumberSeriesService();
