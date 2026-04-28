const RiceLot = require('../models/riceLot.model');
const mongoose = require('mongoose');

/**
 * Calculate profit for a single lot
 * @param {string} lotId - The lot ID
 * @param {string} tenantId - The tenant ID for isolation
 * @returns {Object} Profit calculation result
 */
const calculateLotProfit = async (lotId, tenantId) => {
  try {
    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(lotId)) {
      return { success: false, error: 'Invalid lot ID' };
    }

    const lot = await RiceLot.findOne({ _id: lotId, tenantId });

    if (!lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Calculate sold quantity
    const soldQuantity = lot.quantityTons - lot.remainingQuantity;

    // Calculate cost of goods sold (proportional)
    const costPerTon = lot.totalPurchaseCost / lot.quantityTons;
    const costOfGoodsSold = soldQuantity * costPerTon;

    // Calculate remaining inventory value
    const remainingValue = lot.remainingQuantity * costPerTon;

    // Note: For actual revenue, we would need sales transaction history
    // This calculates potential profit based on current inventory value
    return {
      success: true,
      data: {
        lotId: lot._id,
        lotNumber: lot.lotNumber,
        totalQuantity: lot.quantityTons,
        soldQuantity,
        remainingQuantity: lot.remainingQuantity,
        totalPurchaseCost: lot.totalPurchaseCost,
        costOfGoodsSold,
        remainingInventoryValue: remainingValue,
        costPerTon,
        // Note: Actual profit requires sales data with selling prices
        estimatedProfit: 0, // Would need sales history to calculate
        status: lot.status
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculate total profit from all lots within date range
 * @param {string} tenantId - The tenant ID
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Object} Total profit calculation
 */
const calculateTotalProfit = async (tenantId, startDate, endDate) => {
  try {
    const matchStage = { tenantId: new mongoose.Types.ObjectId(tenantId) };

    if (startDate || endDate) {
      matchStage.purchaseDate = {};
      if (startDate) matchStage.purchaseDate.$gte = new Date(startDate);
      if (endDate) matchStage.purchaseDate.$lte = new Date(endDate);
    }

    const result = await RiceLot.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLots: { $sum: 1 },
          totalQuantity: { $sum: '$quantityTons' },
          totalSold: { $sum: { $subtract: ['$quantityTons', '$remainingQuantity'] } },
          totalPurchaseCost: { $sum: '$totalPurchaseCost' },
          totalRemainingValue: {
            $sum: { $multiply: ['$remainingQuantity', '$purchasePricePerTon'] }
          },
          totalRevenue: { $sum: { $ifNull: ['$totalRevenue', 0] } },
          totalProfit: { $sum: { $ifNull: ['$totalProfit', 0] } }
        }
      }
    ]);

    const data = result.length > 0 ? result[0] : {
      totalLots: 0,
      totalQuantity: 0,
      totalSold: 0,
      totalPurchaseCost: 0,
      totalRemainingValue: 0,
      totalRevenue: 0,
      totalProfit: 0
    };

    return {
      success: true,
      data: {
        ...data,
        averageCostPerTon: data.totalPurchaseCost / (data.totalQuantity || 1),
        soldPercentage: (data.totalSold / (data.totalQuantity || 1)) * 100,
        period: { startDate, endDate }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Group profit by rice quality
 * @param {string} tenantId - The tenant ID
 * @returns {Object} Profit grouped by quality
 */
const getProfitByQuality = async (tenantId) => {
  try {
    const result = await RiceLot.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: '$quality',
          lotCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantityTons' },
          totalSold: { $sum: { $subtract: ['$quantityTons', '$remainingQuantity'] } },
          totalPurchaseCost: { $sum: '$totalPurchaseCost' },
          totalRevenue: { $sum: { $ifNull: ['$totalRevenue', 0] } },
          totalProfit: { $sum: { $ifNull: ['$totalProfit', 0] } },
          averagePricePerTon: { $avg: '$purchasePricePerTon' }
        }
      },
      { $sort: { totalProfit: -1 } }
    ]);

    return {
      success: true,
      data: result.map(item => ({
        quality: item._id,
        lotCount: item.lotCount,
        totalQuantity: item.totalQuantity,
        totalSold: item.totalSold,
        totalPurchaseCost: item.totalPurchaseCost,
        totalRevenue: item.totalRevenue,
        totalProfit: item.totalProfit,
        averagePricePerTon: item.averagePricePerTon
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Group profit by supplier within date range
 * @param {string} tenantId - The tenant ID
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Object} Profit grouped by supplier
 */
const getProfitBySupplier = async (tenantId, startDate, endDate) => {
  try {
    const matchStage = { tenantId: new mongoose.Types.ObjectId(tenantId) };

    if (startDate || endDate) {
      matchStage.purchaseDate = {};
      if (startDate) matchStage.purchaseDate.$gte = new Date(startDate);
      if (endDate) matchStage.purchaseDate.$lte = new Date(endDate);
    }

    const result = await RiceLot.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$supplier',
          lotCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantityTons' },
          totalSold: { $sum: { $subtract: ['$quantityTons', '$remainingQuantity'] } },
          totalPurchaseCost: { $sum: '$totalPurchaseCost' },
          totalRevenue: { $sum: { $ifNull: ['$totalRevenue', 0] } },
          totalProfit: { $sum: { $ifNull: ['$totalProfit', 0] } },
          averagePricePerTon: { $avg: '$purchasePricePerTon' }
        }
      },
      { $sort: { totalProfit: -1 } }
    ]);

    return {
      success: true,
      data: result.map(item => ({
        supplier: item._id,
        lotCount: item.lotCount,
        totalQuantity: item.totalQuantity,
        totalSold: item.totalSold,
        totalPurchaseCost: item.totalPurchaseCost,
        totalRevenue: item.totalRevenue,
        totalProfit: item.totalProfit,
        averagePricePerTon: item.averagePricePerTon
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get monthly profit trend for a given year
 * @param {string} tenantId - The tenant ID
 * @param {number} year - The year
 * @returns {Object} Monthly profit breakdown
 */
const getMonthlyProfitTrend = async (tenantId, year) => {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 0);

    const result = await RiceLot.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          purchaseDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$purchaseDate' },
            month: { $month: '$purchaseDate' }
          },
          lotCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantityTons' },
          totalSold: { $sum: { $subtract: ['$quantityTons', '$remainingQuantity'] } },
          totalPurchaseCost: { $sum: '$totalPurchaseCost' },
          totalRevenue: { $sum: { $ifNull: ['$totalRevenue', 0] } },
          totalProfit: { $sum: { $ifNull: ['$totalProfit', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Build complete monthly data (fill missing months with zeros)
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let month = 0; month < 12; month++) {
      const existing = result.find(r => r._id.year === year && r._id.month === month + 1);

      monthlyData.push({
        month: month + 1,
        monthName: monthNames[month],
        lotCount: existing ? existing.lotCount : 0,
        totalQuantity: existing ? existing.totalQuantity : 0,
        totalSold: existing ? existing.totalSold : 0,
        totalPurchaseCost: existing ? existing.totalPurchaseCost : 0,
        totalRevenue: existing ? existing.totalRevenue : 0,
        totalProfit: existing ? existing.totalProfit : 0
      });
    }

    return {
      success: true,
      data: {
        year,
        months: monthlyData,
        summary: {
          totalLots: monthlyData.reduce((sum, m) => sum + m.lotCount, 0),
          totalProfit: monthlyData.reduce((sum, m) => sum + m.totalProfit, 0),
          totalRevenue: monthlyData.reduce((sum, m) => sum + m.totalRevenue, 0)
        }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get top N profitable lots
 * @param {string} tenantId - The tenant ID
 * @param {number} limit - Number of lots to return
 * @returns {Object} Top profitable lots
 */
const getTopProfitableLots = async (tenantId, limit = 10) => {
  try {
    const lots = await RiceLot.find({ tenantId })
      .sort({ totalProfit: -1, totalRevenue: -1 })
      .limit(limit)
      .select('lotNumber supplier quality quantityTons remainingQuantity totalPurchaseCost totalRevenue totalProfit purchaseDate');

    return {
      success: true,
      data: lots.map(lot => ({
        lotId: lot._id,
        lotNumber: lot.lotNumber,
        supplier: lot.supplier,
        quality: lot.quality,
        quantityTons: lot.quantityTons,
        remainingQuantity: lot.remainingQuantity,
        totalPurchaseCost: lot.totalPurchaseCost,
        totalRevenue: lot.totalRevenue || 0,
        totalProfit: lot.totalProfit || 0,
        purchaseDate: lot.purchaseDate
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculate profit margin percentage for a lot
 * @param {string} lotId - The lot ID
 * @returns {Object} Profit margin percentage
 */
const getProfitMarginPercentage = async (lotId) => {
  try {
    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(lotId)) {
      return { success: false, error: 'Invalid lot ID' };
    }

    const lot = await RiceLot.findById(lotId);

    if (!lot) {
      return { success: false, error: 'Lot not found' };
    }

    const totalRevenue = lot.totalRevenue || 0;
    const totalProfit = lot.totalProfit || 0;

    let profitMargin = 0;
    if (totalRevenue > 0) {
      profitMargin = (totalProfit / totalRevenue) * 100;
    }

    return {
      success: true,
      data: {
        lotId: lot._id,
        lotNumber: lot.lotNumber,
        totalRevenue,
        totalProfit,
        profitMarginPercentage: Math.round(profitMargin * 100) / 100,
        interpretation: profitMargin >= 20 ? 'High margin' : profitMargin >= 10 ? 'Moderate margin' : profitMargin > 0 ? 'Low margin' : 'No profit'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  calculateLotProfit,
  calculateTotalProfit,
  getProfitByQuality,
  getProfitBySupplier,
  getMonthlyProfitTrend,
  getTopProfitableLots,
  getProfitMarginPercentage
};