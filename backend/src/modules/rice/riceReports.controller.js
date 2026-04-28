const riceReportsService = require('./riceReports.service');

exports.getStockReport = async (req, res) => {
  try {
    const { tenantId } = req;
    const report = await riceReportsService.getStockReport(tenantId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProfitLossReport = async (req, res) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;
    const report = await riceReportsService.getProfitLossReport(tenantId, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLotPerformanceReport = async (req, res) => {
  try {
    const { tenantId } = req;
    const report = await riceReportsService.getLotPerformance(tenantId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDashboardReport = async (req, res) => {
  try {
    const { tenantId } = req;
    const report = await riceReportsService.getDashboardReport(tenantId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};