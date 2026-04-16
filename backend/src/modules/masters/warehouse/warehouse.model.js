const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  warehouseCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  location: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false, index: true }
});

module.exports = mongoose.model('Warehouse', WarehouseSchema);
