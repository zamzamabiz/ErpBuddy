const mongoose = require('mongoose');

const riceLotSchema = new mongoose.Schema({
  // Unique lot identifier
  lotNumber: {
    type: String,
    required: [true, 'Lot number is required'],
    unique: true,
    trim: true
  },
  
  // Multi-tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required']
  },
  
  // Supplier information
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true
  },
  
  // Purchase details
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  purchasePricePerTon: {
    type: Number,
    required: [true, 'Purchase price per ton is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  quantityTons: {
    type: Number,
    required: [true, 'Quantity in tons is required'],
    min: [0, 'Quantity cannot be negative']
  },
  totalPurchaseCost: {
    type: Number,
    required: [true, 'Total purchase cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  
  // Storage and quality
  storageLocation: {
    type: String,
    trim: true
  },
  quality: {
    type: String,
    enum: ['Premium', 'Standard', 'Grade A', 'Grade B'],
    default: 'Standard'
  },
  moisture: {
    type: Number,
    min: [0, 'Moisture cannot be negative'],
    max: [100, 'Moisture cannot exceed 100%']
  },
  
  // Inventory tracking
  remainingQuantity: {
    type: Number,
    required: [true, 'Remaining quantity is required'],
    min: [0, 'Remaining quantity cannot be negative']
  },
  status: {
    type: String,
    enum: ['In Stock', 'Partial Sold', 'Sold Out', 'Reserved'],
    default: 'In Stock'
  },
  
  // Additional info
  notes: {
    type: String,
    trim: true
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for multi-tenant queries
riceLotSchema.index({ lotNumber: 1 }, { unique: true });
riceLotSchema.index({ tenantId: 1, lotNumber: 1 }, { unique: true });
riceLotSchema.index({ status: 1 });
riceLotSchema.index({ tenantId: 1 });

// Pre-save middleware: Auto-calculate totalPurchaseCost and set remainingQuantity
riceLotSchema.pre('save', function(next) {
  // Auto-calculate totalPurchaseCost = quantityTons * purchasePricePerTon
  if (this.isNew || this.isModified('quantityTons') || this.isModified('purchasePricePerTon')) {
    this.totalPurchaseCost = this.quantityTons * this.purchasePricePerTon;
  }
  
  // Auto-set remainingQuantity = quantityTons for new documents
  if (this.isNew && !this.remainingQuantity) {
    this.remainingQuantity = this.quantityTons;
  }
  
  // Ensure remainingQuantity never exceeds quantityTons
  if (this.remainingQuantity > this.quantityTons) {
    const error = new Error('Remaining quantity cannot exceed original quantity');
    error.statusCode = 400;
    return next(error);
  }
  
  // Auto-update status based on remainingQuantity
  this.updateStatus();
  
  next();
});

// Pre-validate middleware
riceLotSchema.pre('validate', function(next) {
  // Ensure totalPurchaseCost matches calculation
  if (this.totalPurchaseCost !== this.quantityTons * this.purchasePricePerTon) {
    this.totalPurchaseCost = this.quantityTons * this.purchasePricePerTon;
  }
  
  // Ensure remainingQuantity never exceeds quantityTons
  if (this.remainingQuantity > this.quantityTons) {
    this.remainingQuantity = this.quantityTons;
  }
  
  next();
});

// Instance method: Sell quantity from this lot
riceLotSchema.methods.sell = function(quantitySold, sellingPricePerTon) {
  if (quantitySold <= 0) {
    throw new Error('Quantity sold must be positive');
  }
  
  if (quantitySold > this.remainingQuantity) {
    throw new Error('Cannot sell more than remaining quantity');
  }
  
  if (sellingPricePerTon < 0) {
    throw new Error('Selling price cannot be negative');
  }
  
  // Calculate cost of goods sold (proportional to purchase cost)
  const costPerTon = this.totalPurchaseCost / this.quantityTons;
  const costOfGoodsSold = quantitySold * costPerTon;
  const revenue = quantitySold * sellingPricePerTon;
  const profit = revenue - costOfGoodsSold;
  
  // Update remaining quantity
  this.remainingQuantity -= quantitySold;
  
  // Update status
  this.updateStatus();
  
  return {
    quantitySold,
    revenue,
    costOfGoodsSold,
    profit,
    remainingQuantity: this.remainingQuantity,
    status: this.status
  };
};

// Instance method: Get current inventory value
riceLotSchema.methods.getCurrentValue = function() {
  return this.remainingQuantity * this.purchasePricePerTon;
};

// Instance method: Check if fully sold
riceLotSchema.methods.isFullySold = function() {
  return this.remainingQuantity === 0;
};

// Instance method: Auto-update status based on remainingQuantity
riceLotSchema.methods.updateStatus = function() {
  if (this.remainingQuantity === 0) {
    this.status = 'Sold Out';
  } else if (this.remainingQuantity < this.quantityTons) {
    if (this.status !== 'Reserved') {
      this.status = 'Partial Sold';
    }
  } else {
    this.status = 'In Stock';
  }
};

// Static method: Find available lots (remaining quantity > 0)
riceLotSchema.statics.findAvailableLots = function(tenantId) {
  return this.find({
    tenantId,
    remainingQuantity: { $gt: 0 },
    status: { $in: ['In Stock', 'Partial Sold', 'Reserved'] }
  });
};

// Static method: Get total inventory value for a tenant
riceLotSchema.statics.getTotalInventoryValue = async function(tenantId) {
  const result = await this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: null,
        totalValue: {
          $sum: { $multiply: ['$remainingQuantity', '$purchasePricePerTon'] }
        }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].totalValue : 0;
};

// Static method: Get profit summary for a date range
riceLotSchema.statics.getProfitSummary = async function(tenantId, startDate, endDate) {
  const matchStage = {
    tenantId: new mongoose.Types.ObjectId(tenantId)
  };
  
  if (startDate || endDate) {
    matchStage.purchaseDate = {};
    if (startDate) matchStage.purchaseDate.$gte = new Date(startDate);
    if (endDate) matchStage.purchaseDate.$lte = new Date(endDate);
  }
  
  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantityTons' },
        totalSold: { $sum: { $subtract: ['$quantityTons', '$remainingQuantity'] } },
        totalCost: { $sum: '$totalPurchaseCost' },
        totalRemainingValue: {
          $sum: { $multiply: ['$remainingQuantity', '$purchasePricePerTon'] }
        },
        averageCostPerTon: { $avg: '$purchasePricePerTon' },
        lotCount: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length === 0) {
    return {
      totalQuantity: 0,
      totalSold: 0,
      totalCost: 0,
      totalRemainingValue: 0,
      estimatedProfit: 0,
      lotCount: 0
    };
  }
  
  const data = result[0];
  return {
    totalQuantity: data.totalQuantity,
    totalSold: data.totalSold,
    totalCost: data.totalCost,
    totalRemainingValue: data.totalRemainingValue,
    estimatedProfit: data.totalCost - data.totalRemainingValue, // Simplified profit calculation
    averageCostPerTon: data.averageCostPerTon,
    lotCount: data.lotCount
  };
};

module.exports = mongoose.model('RiceLot', riceLotSchema);