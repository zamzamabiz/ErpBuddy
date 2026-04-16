const BaseRepository = require('@shared/base.repository');
const Auth = require('./auth.model');

class AuthRepository extends BaseRepository {
  constructor() {
    super(Auth);
  }

  async findByEmail(email) {
    return this.model.findOne({ email, isDeleted: false });
  }

  async saveRefreshToken(userId, refreshToken) {
    return this.model.findOneAndUpdate({ userId }, { refreshToken }, { new: true });
  }

  async updateLastLogin(userId) {
    return this.model.findOneAndUpdate({ userId }, { lastLogin: new Date() }, { new: true });
  }
}

module.exports = new AuthRepository();
