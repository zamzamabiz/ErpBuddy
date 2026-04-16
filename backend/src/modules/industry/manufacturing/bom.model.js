const mongoose = require('mongoose');
const { Schema } = mongoose;

const bomItemSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

const bomSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  bomNumber: { type: String, required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  version: { type: String },
  items: { type: [bomItemSchema], required: true },
  remarks: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

bomSchema.index({ tenantId: 1, companyId: 1, bomNumber: 1 }, { unique: true });

module.exports = mongoose.model('BOM', bomSchema);
