const mongoose = require('mongoose');
const { Schema } = mongoose;

const attendanceSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Leave', 'Half Day', 'Holiday'], required: true },
  inTime: { type: String },
  outTime: { type: String },
  remarks: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

attendanceSchema.index({ tenantId: 1, companyId: 1, employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
