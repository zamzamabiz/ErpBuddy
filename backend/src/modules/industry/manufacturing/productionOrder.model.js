const mongoose = require('mongoose');
const { Schema } = mongoose;

const productionMaterialSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

const productionOutputSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

const productionOrderSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  productionNumber: { type: String, required: true },
  productionDate: { type: Date, required: true },
  bom: { type: Schema.Types.ObjectId, ref: 'BOM', required: true },
  materials: { type: [productionMaterialSchema], required: true },
  outputs: { type: [productionOutputSchema], required: true },
  wipWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  fgWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  status: { type: String, enum: ['Draft', 'In Progress', 'Completed', 'Cancelled'], default: 'Draft' },
  totalCost: { type: Number, default: 0 },
  document: { type: Schema.Types.ObjectId, ref: 'Document' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productionOrderSchema.index({ tenantId: 1, companyId: 1, productionNumber: 1 }, { unique: true });

module.exports = mongoose.model('ProductionOrder', productionOrderSchema);
