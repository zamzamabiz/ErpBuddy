const BaseRepository = require('../../../shared/base.repository');
const Payroll = require('./payroll.model');

class PayrollRepository extends BaseRepository {
  constructor() {
    super(Payroll);
  }
}

module.exports = new PayrollRepository();
