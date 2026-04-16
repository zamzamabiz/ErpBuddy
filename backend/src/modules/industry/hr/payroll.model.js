const mongoose = require('mongoose');
const { Schema } = mongoose;

const payrollSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  payrollMonth: { type: String, required: true }, // e.g. '2026-04'
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  basic: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Posted', 'Cancelled'], default: 'Draft' },
  postedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

payrollSchema.index({ tenantId: 1, companyId: 1, payrollMonth: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
