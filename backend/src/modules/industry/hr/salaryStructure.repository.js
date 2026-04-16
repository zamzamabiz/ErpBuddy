const BaseRepository = require('../../../shared/base.repository');
const SalaryStructure = require('./salaryStructure.model');

class SalaryStructureRepository extends BaseRepository {
  constructor() {
    super(SalaryStructure);
  }
}

module.exports = new SalaryStructureRepository();
