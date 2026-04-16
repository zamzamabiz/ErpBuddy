const BaseRepository = require('../../../shared/base.repository');
const Attendance = require('./attendance.model');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super(Attendance);
  }
}

module.exports = new AttendanceRepository();
