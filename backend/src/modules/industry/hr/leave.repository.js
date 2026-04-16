const BaseRepository = require('../../../shared/base.repository');
const Leave = require('./leave.model');

class LeaveRepository extends BaseRepository {
  constructor() {
    super(Leave);
  }
}

module.exports = new LeaveRepository();
