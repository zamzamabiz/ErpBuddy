const mongoose = require('mongoose');
const { Schema } = mongoose;

const journalEntryLineSchema = new Schema({
  account: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  description: { type: String }
}, { _id: false });

const journalEntrySchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  journalNumber: { type: String, required: true },
  journalDate: { type: Date, required: true },
  document: { type: Schema.Types.ObjectId, ref: 'Document' },
  referenceNumber: { type: String },
  description: { type: String },
  totalDebit: { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Posted', 'Cancelled'], default: 'Draft' },
  lines: { type: [journalEntryLineSchema], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

journalEntrySchema.index({ company: 1, journalNumber: 1 }, { unique: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
