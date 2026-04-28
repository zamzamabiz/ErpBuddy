const mongoose = require('mongoose');

const riceLotSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  lotNumber: { type: String, required: true, trim: true },
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  supplierName: { type: String, required: true, trim: true },
  quantityBags: { type: Number, required: true, min: 1 },
  weightPerBag: { type: Number, default: 50 },
  totalWeight: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'Premium'], default: 'B' },
  moisture: { type: Number, default: 0, min: 0, max: 100 },
  brokenPercentage: { type: Number, default: 0, min: 0, max: 100 },
  purchaseRate: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, default: 0 },
  storageLocation: { type: String, default: '' },
  status: { type: String, enum: ['in-stock', 'partial', 'sold', 'damaged'], default: 'in-stock' },
  remainingQuantity: { type: Number, default: 0 },
  soldQuantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  profitPerUnit: { type: Number, default: 0 },
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

riceLotSchema.pre('save', function(next) {
  this.totalWeight = this.quantityBags * this.weightPerBag;
  this.totalCost = this.totalWeight * this.purchaseRate;
  this.remainingQuantity = this.quantityBags - this.soldQuantity;
  next();
});

module.exports = mongoose.model('RiceLot', riceLotSchema);