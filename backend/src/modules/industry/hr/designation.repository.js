const BaseRepository = require('../../../shared/base.repository');
const Designation = require('./designation.model');

class DesignationRepository extends BaseRepository {
  constructor() {
    super(Designation);
  }
}

module.exports = new DesignationRepository();
