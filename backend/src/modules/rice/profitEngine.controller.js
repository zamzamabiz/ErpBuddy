const profitEngineService = require('./profitEngine.service');

exports.calculateProfit = async (req, res) => {
  try {
    const { tenantId } = req;
    const { lotId } = req.params;
    const profit = await profitEngineService.calculateProfit(lotId, tenantId, req.body);
    res.json({ success: true, data: profit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProfitSummary = async (req, res) => {
  try {
    const { tenantId } = req;
    const { lotId } = req.params;
    const summary = await profitEngineService.getProfitSummary(lotId, tenantId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDashboardProfit = async (req, res) => {
  try {
    const { tenantId } = req;
    const dashboard = await profitEngineService.getDashboardProfit(tenantId);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};