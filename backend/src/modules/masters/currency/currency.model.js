const mongoose = require('mongoose');
const { Schema } = mongoose;

const CurrencySchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  currencyCode: { type: String, required: true, unique: true },
  currencyName: { type: String, required: true },
  symbol: { type: String },
  exchangeRate: { type: Number, default: 1 },
  isBaseCurrency: { type: Boolean, default: false },
  decimalPlaces: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

CurrencySchema.index({ company: 1, currencyCode: 1 }, { unique: true });

module.exports = mongoose.model('Currency', CurrencySchema);
