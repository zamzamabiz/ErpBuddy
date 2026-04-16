const mongoose = require('mongoose');
const { Schema } = mongoose;

const payrollSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  payPeriodStart: { type: Date, required: true },
  payPeriodEnd: { type: Date, required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  documentNo: { type: String, required: true, unique: true },
  journalId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  status: { type: String, enum: ['Draft', 'Processed', 'Posted', 'Paid'], default: 'Draft' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

payrollSchema.index({ companyId: 1, employeeId: 1, payPeriodStart: 1, payPeriodEnd: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
