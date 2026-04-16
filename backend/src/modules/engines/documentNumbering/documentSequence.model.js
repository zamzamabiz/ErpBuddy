const mongoose = require('mongoose');

const documentSequenceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  module: { 
    type: String, 
    required: true,
    enum: ['sales', 'purchase', 'journal', 'payment', 'receipt', 'inventory', 'payroll'],
    index: true
  },
  prefix: { type: String, required: true }, // INV, PO, JV, PAY, REC, STK, SAL
  year: { type: Number, required: true, index: true }, // Current year
  currentNumber: { type: Number, default: 0 }, // Incremental counter
  padding: { type: Number, default: 5 }, // Number of digits (e.g., 5 = 00001)
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// UNIQUE INDEX: Ensures no duplicate sequences per tenant, module, and year
documentSequenceSchema.index(
  { tenantId: 1, module: 1, year: 1 },
  { unique: true, sparse: true }
);

// COMPOUND INDEX for efficient lookups
documentSequenceSchema.index({ tenantId: 1, module: 1, year: 1, isActive: 1 });

module.exports = mongoose.model('DocumentSequence', documentSequenceSchema);
