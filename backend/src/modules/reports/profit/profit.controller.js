const profitService = require('./profit.service');

/**
 * GET PROFIT BY SALE
 * GET /api/profit/sale/:saleId
 */
async function getProfitBySale(req, res) {
  try {
    const result = await profitService.getProfitBySale(req.params.saleId, req);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Get profit by sale error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET OVERALL PROFIT SUMMARY
 * GET /api/profit/summary
 */
async function getOverallProfit(req, res) {
  try {
    const result = await profitService.getOverallProfit(req);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Get overall profit error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET PROFIT BY ITEM
 * GET /api/profit/by-item
 */
async function getProfitByItem(req, res) {
  try {
    const result = await profitService.getProfitByItem(req);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Get profit by item error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getProfitBySale,
  getOverallProfit,
  getProfitByItem
};