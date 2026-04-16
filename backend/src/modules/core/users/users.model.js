const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BaseModelSchema = require('@shared/base.model');

const UsersSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  phone: { type: String, trim: true },
  avatar: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true }
});

// Unique constraints per company
UsersSchema.index({ companyId: 1, email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
UsersSchema.index({ companyId: 1, username: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Hash password before save
UsersSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UsersSchema.add(BaseModelSchema);

module.exports = mongoose.model('User', UsersSchema);
