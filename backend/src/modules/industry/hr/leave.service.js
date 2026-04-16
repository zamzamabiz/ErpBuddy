const BaseService = require('../../../shared/base.service');
const LeaveRepository = require('./leave.repository');

class LeaveService extends BaseService {
  constructor() {
    super(LeaveRepository);
  }
}

module.exports = new LeaveService();
