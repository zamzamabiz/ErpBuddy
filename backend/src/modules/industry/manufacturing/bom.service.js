const BaseService = require('../../../shared/base.service');
const BOMRepository = require('./bom.repository');

class BOMService extends BaseService {
  constructor() {
    super(BOMRepository);
  }
  // Add custom BOM logic as needed
}

module.exports = new BOMService();
