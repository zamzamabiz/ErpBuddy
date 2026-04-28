const mongoose = require('mongoose');
const { Schema } = mongoose;

const salesItemSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  bags: { type: Number, default: 0 },
  weightPerBag: { type: Number, default: 0 },
  // 🔴 COGS Fields (populated during posting)
  cost: { type: Number, default: 0, description: 'Total COGS for this item' },
  unitCost: { type: Number, default: 0, description: 'Unit cost using weighted average cost' },
  // 🟢 Rice-specific fields
  grossWeight: { type: Number, default: 0, description: 'Gross weight before deductions' },
  moisturePercent: { type: Number, default: 0, description: 'Moisture content percentage' },
  brokenPercent: { type: Number, default: 0, description: 'Broken rice percentage' },
  deductionWeight: { type: Number, default: 0, description: 'Weight deduction for quality' },
  netWeight: { type: Number, default: 0, description: 'Net weight after deductions' },
  packingCost: { type: Number, default: 0, description: 'Packing expenses' },
  transportCost: { type: Number, default: 0, description: 'Transport expenses' },
  loadingCost: { type: Number, default: 0, description: 'Loading/unloading expenses' }
}, { _id: false });

const salesSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  salesNumber: { type: String, required: true },
  salesDate: { type: Date, required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  currency: { type: Schema.Types.ObjectId, ref: 'Currency', required: true },
  exchangeRate: { type: Number, default: 1 },
  commodity: { type: String, default: "" },
  broker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null
  },
  brokerCommission: { type: Number, default: 0 },
  items: { type: [salesItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Posted', 'Cancelled'], default: 'Draft' },
  customerAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    description: 'Accounts Receivable account'
  },
  salesAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    description: 'Sales Revenue account'
  },
  journalId: {
    type: Schema.Types.ObjectId,
    ref: 'Journal',
    default: null,
    description: 'Reference to auto-created journal entry'
  },
  // 🔴 COGS Journal & Tracking
  cogsJournalId: {
    type: Schema.Types.ObjectId,
    ref: 'Journal',
    default: null,
    description: 'Reference to auto-created COGS journal entry'
  },
  totalCOGS: {
    type: Number,
    default: 0,
    description: 'Total Cost of Goods Sold (weighted average cost)'
  },
  // 🟢 Rice-specific expense fields
  totalExpenses: {
    type: Number,
    default: 0,
    description: 'Total expenses (packing + transport + loading)'
  },
  grossProfit: {
    type: Number,
    default: 0,
    description: 'Gross profit (sales - COGS - expenses)'
  },
  cogsAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    description: 'COGS Expense account'
  },
  inventoryAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    description: 'Inventory Asset account'
  },
  document: { type: Schema.Types.ObjectId, ref: 'Document' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

salesSchema.index({ company: 1, salesNumber: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

module.exports = mongoose.models.Sales || mongoose.model('Sales', salesSchema);
