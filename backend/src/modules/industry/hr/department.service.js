const BaseService = require('../../../shared/base.service');
const DepartmentRepository = require('./department.repository');

class DepartmentService extends BaseService {
  constructor() {
    super(DepartmentRepository);
  }
}

module.exports = new DepartmentService();
