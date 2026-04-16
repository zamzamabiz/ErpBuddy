const BaseService = require('../../../shared/base.service');
const EmployeeRepository = require('./employee.repository');

class EmployeeService extends BaseService {
  constructor() {
    super(EmployeeRepository);
  }
}

module.exports = new EmployeeService();
