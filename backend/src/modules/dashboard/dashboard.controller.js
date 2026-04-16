const service = require('./dashboard.service');

/**
 * Get Dashboard Stats
 * Returns system statistics and financial summary
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    // Get basic stats
    const stats = await service.getDashboardStats();
    
    // Get summary data
    const summary = await service.getSummary(tenantId);

    // Combine both
    res.json({ 
      success: true, 
      data: {
        ...stats,
        summary: summary
      }
    });
  } catch (err) {
    next(err);
  }
};
