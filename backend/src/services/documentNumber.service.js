// Generic Document Number Generator Service
const NumberSeriesService = require('../shared/numberSeries.service');

class DocumentNumberService {
  /**
   * Generate a new master code for a given module and company
   * @param {string} module - Module name (e.g., 'customers', 'suppliers', 'items')
   * @param {string} companyId - Company ID
   * @returns {Promise<string>} - Generated code
   */
  async generate(module, companyId) {
    return await NumberSeriesService.generateMasterCode(companyId, module);
  }
}

module.exports = new DocumentNumberService();
