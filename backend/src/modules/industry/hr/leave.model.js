const mongoose = require('mongoose');
const { Schema } = mongoose;

const leaveSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  reason: { type: String },
  remarks: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

leaveSchema.index({ tenantId: 1, companyId: 1, employee: 1, startDate: 1, endDate: 1 }, { unique: false });

module.exports = mongoose.model('Leave', leaveSchema);
