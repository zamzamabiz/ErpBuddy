const mongoose = require('mongoose');
const BaseModelSchema = require('@shared/base.model');

const PermissionsSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  description: { type: String },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] }
});

PermissionsSchema.add(BaseModelSchema);

module.exports = mongoose.model('Permission', PermissionsSchema);
