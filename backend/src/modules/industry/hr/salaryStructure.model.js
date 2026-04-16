const mongoose = require('mongoose');
const { Schema } = mongoose;

const salaryStructureSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  effectiveFrom: { type: Date, required: true },
  basic: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  remarks: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

salaryStructureSchema.index({ tenantId: 1, companyId: 1, employee: 1, effectiveFrom: 1 }, { unique: true });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
