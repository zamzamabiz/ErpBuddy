const BaseService = require('../../../shared/base.service');
const SalaryStructureRepository = require('./salaryStructure.repository');

class SalaryStructureService extends BaseService {
  constructor() {
    super(SalaryStructureRepository);
  }
}

module.exports = new SalaryStructureService();
