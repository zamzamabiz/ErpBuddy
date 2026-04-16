const mongoose = require('mongoose');

const NumberSeriesSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  module: { type: String, required: true, index: true },
  prefix: { type: String, required: true },
  lastNumber: { type: Number, default: 0 },
  codeLength: { type: Number, default: 8 },
  resetYearly: { type: Boolean, default: false },
  resetMonthly: { type: Boolean, default: false },
  year: { type: Number },
  month: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

NumberSeriesSchema.index({ companyId: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('NumberSeries', NumberSeriesSchema);
