const mongoose = require('mongoose');
const BaseModelSchema = require('@shared/base.model');

const RolesSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isSystemRole: { type: Boolean, default: false },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true }
});

RolesSchema.index({ companyId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
RolesSchema.add(BaseModelSchema);

module.exports = mongoose.model('Role', RolesSchema);
