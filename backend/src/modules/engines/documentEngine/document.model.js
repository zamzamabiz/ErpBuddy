const mongoose = require('mongoose');
const { Schema } = mongoose;

const DocumentSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  documentType: { type: String, required: true }, // Invoice, PO, SO, GRN, JV, PV, RV
  documentNumber: { type: String, required: true },
  documentDate: { type: Date, required: true },
  referenceNumber: { type: String },
  party: { type: Schema.Types.ObjectId, ref: 'Party' },
  currency: { type: Schema.Types.ObjectId, ref: 'Currency' },
  exchangeRate: { type: Number, default: 1 },
  totalAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Posted', 'Cancelled'], default: 'Draft' },
  remarks: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

DocumentSchema.index({ company: 1, documentType: 1, documentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Document', DocumentSchema);
