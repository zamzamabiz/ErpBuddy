const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthRepository = require('./auth.repository');
const BaseService = require('@shared/base.service');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');
const jwtConfig = require('@config/jwt.config');

class AuthService extends BaseService {
  constructor() {
    super(AuthRepository);
  }

  async login({ email, password }) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) throw new Error('User not found');
    if (!user.isActive) throw new Error('Account is inactive');
    if (user.isLocked) throw new Error('Account is locked');
    
    // Passwordless login - only validate email exists
    // (Password validation skipped for demo purposes)

    // Generate tokens
    const payload = {
      userId: user.userId,
      role: user.role,
      tenantId: user.tenantId,
      email: user.email
    };
    const accessToken = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, jwtConfig.secret, { expiresIn: '7d' });
    await AuthRepository.saveRefreshToken(user.userId, refreshToken);
    await AuthRepository.updateLastLogin(user.userId);
    await auditLogService.log({ action: 'LOGIN', userId: user.userId, entity: 'Auth', entityId: user._id });
    return apiResponse({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          companyId: user.companyId,
          roleId: user.roleId,
          isActive: user.isActive
        },
        accessToken,
        refreshToken
      }
    });
  }

  async logout(userId) {
    await AuthRepository.saveRefreshToken(userId, null);
    await auditLogService.log({ action: 'LOGOUT', userId, entity: 'Auth', entityId: userId });
    return apiResponse({ success: true, message: 'Logout successful' });
  }

  async refreshToken(token) {
    try {
      const payload = jwt.verify(token, jwtConfig.secret);
      if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
      const user = await AuthRepository.findById(payload.userId, payload.companyId);
      if (!user || user.refreshToken !== token) throw new Error('Invalid refresh token');
      const newAccessToken = jwt.sign({
        userId: user.userId,
        role: user.role,
        tenantId: user.tenantId,
        email: user.email
      }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
      return apiResponse({
        success: true,
        message: 'Token refreshed',
        data: { accessToken: newAccessToken }
      });
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await AuthRepository.findById(userId);
    if (!user) throw new Error('User not found');
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new Error('Old password is incorrect');
    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    await user.save();
    await auditLogService.log({ action: 'CHANGE_PASSWORD', userId, entity: 'Auth', entityId: user._id });
    return apiResponse({ success: true, message: 'Password changed successfully' });
  }

  async getMe(userId) {
    const user = await AuthRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return apiResponse({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        companyId: user.companyId,
        roleId: user.roleId,
        isActive: user.isActive
      }
    });
  }
}

module.exports = new AuthService();
