const mongoose = require('mongoose');

const profitEngineSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiceLot', required: true },
  lotNumber: { type: String, required: true },
  
  // Purchase details
  purchaseQuantity: { type: Number, required: true },
  purchaseWeight: { type: Number, required: true },
  purchaseRate: { type: Number, required: true },
  totalPurchaseCost: { type: Number, required: true },
  
  // Sale details
  saleQuantity: { type: Number, default: 0 },
  saleWeight: { type: Number, default: 0 },
  saleRate: { type: Number, default: 0 },
  totalSaleRevenue: { type: Number, default: 0 },
  
  // Profit calculations
  grossProfit: { type: Number, default: 0 },
  grossMargin: { type: Number, default: 0 }, // percentage
  profitPerKg: { type: Number, default: 0 },
  
  // Quality adjustments
  moistureDeduction: { type: Number, default: 0 },
  brokenDeduction: { type: Number, default: 0 },
  gradePremium: { type: Number, default: 0 },
  
  // Expenses
  brokerage: { type: Number, default: 0 },
  transportCost: { type: Number, default: 0 },
  storageCost: { type: Number, default: 0 },
  otherExpenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  netMargin: { type: Number, default: 0 },
  
  // Selling party
  buyerName: { type: String, default: '' },
  invoiceNumber: { type: String, default: '' },
  
  transactionDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for tenant isolation and fast queries
profitEngineSchema.index({ tenantId: 1, lotId: 1 });
profitEngineSchema.index({ tenantId: 1, transactionDate: -1 });

module.exports = mongoose.model('ProfitEngine', profitEngineSchema);