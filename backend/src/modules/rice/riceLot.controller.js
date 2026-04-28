const riceLotService = require('./riceLot.service');

exports.createLot = async (req, res) => {
  try {
    const { tenantId } = req;
    const lotData = { ...req.body, tenantId };
    const lot = await riceLotService.createLot(lotData);
    res.status(201).json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllLots = async (req, res) => {
  try {
    const { tenantId } = req;
    const lots = await riceLotService.getAllLots(tenantId, req.query);
    res.json({ success: true, data: lots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLotById = async (req, res) => {
  try {
    const { tenantId } = req;
    const lot = await riceLotService.getLotById(req.params.id, tenantId);
    if (!lot) return res.status(404).json({ success: false, error: 'Lot not found' });
    res.json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLot = async (req, res) => {
  try {
    const { tenantId } = req;
    const lot = await riceLotService.updateLot(req.params.id, tenantId, req.body);
    if (!lot) return res.status(404).json({ success: false, error: 'Lot not found' });
    res.json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteLot = async (req, res) => {
  try {
    const { tenantId } = req;
    const lot = await riceLotService.deleteLot(req.params.id, tenantId);
    if (!lot) return res.status(404).json({ success: false, error: 'Lot not found' });
    res.json({ success: true, message: 'Lot deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAvailableLots = async (req, res) => {
  try {
    const { tenantId } = req;
    const lots = await riceLotService.getAvailableLots(tenantId);
    res.json({ success: true, data: lots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sellFromLot = async (req, res) => {
  try {
    const { tenantId } = req;
    const { quantity } = req.body;
    const lot = await riceLotService.sellFromLot(req.params.id, tenantId, quantity);
    res.json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.reserveForSale = async (req, res) => {
  try {
    const { tenantId } = req;
    const { quantity } = req.body;
    const lot = await riceLotService.reserveForSale(req.params.id, tenantId, quantity);
    res.json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.confirmSale = async (req, res) => {
  try {
    const { tenantId } = req;
    const { quantity, salePrice } = req.body;
    const lot = await riceLotService.confirmSale(req.params.id, tenantId, quantity, salePrice);
    res.json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLotProfit = async (req, res) => {
  try {
    const { tenantId } = req;
    const profit = await riceLotService.getLotProfit(req.params.id, tenantId);
    res.json({ success: true, data: profit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
