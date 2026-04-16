const BaseService = require('../../../shared/base.service');
const AttendanceRepository = require('./attendance.repository');

class AttendanceService extends BaseService {
  constructor() {
    super(AttendanceRepository);
  }
}

module.exports = new AttendanceService();
