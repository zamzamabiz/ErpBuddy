const express = require('express');
const router = express.Router();
const DashboardService = require('./dashboard.service');
const authMiddleware = require('../../middleware/auth.middleware');

/**
 * Validate date string (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * GET /api/dashboard
 * Get dashboard metrics
 * Query params: asOfDate (optional, YYYY-MM-DD format)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    
    // Get tenantId from authenticated user
    const tenantId = req.tenantId || req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required - tenantId not found' });
    }

    // Validate date
    if (asOfDate && !isValidDate(asOfDate)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid asOfDate format. Use YYYY-MM-DD' 
      });
    }

    // Get dashboard metrics
    const metrics = await DashboardService.getDashboardMetrics(
      tenantId,
      asOfDate ? new Date(asOfDate) : null
    );

    res.json({
      success: true,
      data: metrics,
      message: 'Dashboard metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;