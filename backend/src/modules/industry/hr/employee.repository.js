const BaseRepository = require('../../../shared/base.repository');
const Employee = require('./employee.model');

class EmployeeRepository extends BaseRepository {
  constructor() {
    super(Employee);
  }
}

module.exports = new EmployeeRepository();
