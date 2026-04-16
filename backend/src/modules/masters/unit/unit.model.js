const mongoose = require('mongoose');
const { Schema } = mongoose;


const UnitSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  unitCode: { type: String, required: true, unique: true },
  unitName: { type: String, required: true },
  symbol: { type: String },
  decimalPlaces: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

UnitSchema.index({ company: 1, unitCode: 1 }, { unique: true });

module.exports = mongoose.model('Unit', UnitSchema);
