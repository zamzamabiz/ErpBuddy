const BaseService = require('@shared/base.service');
const unitRepository = require('./unit.repository');

class UnitService extends BaseService {
  constructor() {
    super(unitRepository);
  }
  // Add custom service methods if needed
}

module.exports = new UnitService();
