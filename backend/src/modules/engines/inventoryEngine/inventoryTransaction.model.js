const mongoose = require('mongoose');
const { Schema } = mongoose;

const inventoryTransactionSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  document: { type: Schema.Types.ObjectId, ref: 'Document' },
  transactionType: { type: String, enum: ['Purchase', 'Sale', 'Transfer', 'Adjustment', 'Production'], required: true },
  quantityIn: { type: Number, default: 0 },
  quantityOut: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  transactionDate: { type: Date, required: true },
  remarks: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

inventoryTransactionSchema.index({ company: 1, item: 1, warehouse: 1, transactionDate: 1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
