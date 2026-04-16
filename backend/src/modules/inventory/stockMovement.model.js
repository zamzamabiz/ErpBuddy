const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['PURCHASE', 'SALE', 'ADJUSTMENT']
  },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceType: { type: String },
  description: { type: String, default: '' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);