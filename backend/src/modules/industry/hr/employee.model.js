const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeCode: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: Schema.Types.ObjectId, ref: 'Designation' },
  dateOfJoining: { type: Date },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

employeeSchema.index({ tenantId: 1, companyId: 1, employeeCode: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
