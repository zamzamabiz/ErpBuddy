const mongoose = require('mongoose');
const BaseModelSchema = require('@shared/base.model');

const AuthSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshToken: { type: String },
  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false }
});

AuthSchema.add(BaseModelSchema);

module.exports = mongoose.model('Auth', AuthSchema);
