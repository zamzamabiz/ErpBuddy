/**
 * Reports Controller
 * Handles requests for financial reports
 */

const reportsService = require('./reports.service');

/**
 * GET /api/reports/trial-balance
 * Get trial balance report
 */
async function getTrialBalance(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { fromDate, toDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const filters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;

    const trialBalance = await reportsService.getTrialBalance(tenantId, filters);

    return res.status(200).json({
      success: true,
      data: trialBalance,
      message: 'Trial balance retrieved successfully'
    });
  } catch (error) {
    console.error('Trial balance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve trial balance'
    });
  }
}

/**
 * GET /api/reports/profit-loss
 * Get profit and loss report
 */
async function getProfitAndLoss(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { fromDate, toDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const filters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;

    const profitLoss = await reportsService.getProfitAndLoss(tenantId, filters);

    return res.status(200).json({
      success: true,
      data: profitLoss,
      message: 'Profit & Loss report retrieved successfully'
    });
  } catch (error) {
    console.error('Profit & Loss error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve Profit & Loss'
    });
  }
}

/**
 * GET /api/reports/account-detail/:accountCode
 * Get account detail with all entries
 */
async function getAccountDetail(req, res) {
  try {
    const tenantId = req.tenantId || req.companyId;
    const { accountCode } = req.params;
    const { fromDate, toDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!accountCode) {
      return res.status(400).json({
        success: false,
        message: 'Account code is required'
      });
    }

    const filters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;

    const accountDetail = await reportsService.getAccountDetail(tenantId, accountCode, filters);

    return res.status(200).json({
      success: true,
      data: accountDetail,
      message: 'Account detail retrieved successfully'
    });
  } catch (error) {
    console.error('Account detail error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve account detail'
    });
  }
}

module.exports = {
  getTrialBalance,
  getProfitAndLoss,
  getAccountDetail
};
