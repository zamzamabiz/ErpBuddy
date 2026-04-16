const mongoose = require('mongoose');

const BaseModelSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true }
}, {
  timestamps: true,
  discriminatorKey: 'kind',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = BaseModelSchema;
