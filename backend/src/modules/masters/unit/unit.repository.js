const BaseRepository = require('@shared/base.repository');
const Unit = require('./unit.model');

class UnitRepository extends BaseRepository {
  constructor() {
    super(Unit);
  }
  // Add custom repository methods if needed
}

module.exports = new UnitRepository();
