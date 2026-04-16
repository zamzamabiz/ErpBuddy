const BaseRepository = require('../../../shared/base.repository');
const Department = require('./department.model');

class DepartmentRepository extends BaseRepository {
  constructor() {
    super(Department);
  }
}

module.exports = new DepartmentRepository();
