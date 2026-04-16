const mongoose = require('mongoose');
const { Schema } = mongoose;

const departmentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

departmentSchema.index({ tenantId: 1, companyId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
