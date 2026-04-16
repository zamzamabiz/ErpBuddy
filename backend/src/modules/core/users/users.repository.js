const BaseRepository = require('@shared/base.repository');
const User = require('./users.model');

class UsersRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(companyId, email) {
    return this.model.findOne({ companyId, email, isDeleted: false });
  }

  async findByUsername(companyId, username) {
    return this.model.findOne({ companyId, username, isDeleted: false });
  }

  async findByIdWithPassword(companyId, id) {
    return this.model.findOne({ _id: id, companyId, isDeleted: false }).select('+password');
  }

  async updateLastLogin(companyId, id) {
    return this.model.findOneAndUpdate({ _id: id, companyId }, { lastLogin: new Date() }, { new: true });
  }
}

module.exports = new UsersRepository();
