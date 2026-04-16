const BaseService = require('../../../shared/base.service');
const PayrollRepository = require('./payroll.repository');

class PayrollService extends BaseService {
  constructor() {
    super(PayrollRepository);
  }
}

module.exports = new PayrollService();
