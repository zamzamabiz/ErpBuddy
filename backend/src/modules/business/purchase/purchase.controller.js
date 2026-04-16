const { createPurchase, getAllPurchases, getPurchaseById, updatePurchase } = require('./purchase.service');

async function createPurchaseController(req, res) {
  try {
    console.log('🔍 Purchase Controller - Create:', {
      hasCompanyId: !!req.companyId,
      companyId: req.companyId,
      hasTenantId: !!req.tenantId,
      tenantId: req.tenantId
    });
    const saved = await createPurchase(req.body, req);
    res.json({ success: true, data: saved });
  } catch (err) {
    console.error('❌ Purchase Create Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getAllPurchasesController(req, res) {
  try {
    const data = await getAllPurchases(req);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getPurchaseByIdController(req, res) {
  try {
    const data = await getPurchaseById(req.params.id, req);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updatePurchaseController(req, res) {
  try {
    const data = await updatePurchase(req.params.id, req.body, req);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  createPurchase: createPurchaseController,
  getAllPurchases: getAllPurchasesController,
  getPurchaseById: getPurchaseByIdController,
  updatePurchase: updatePurchaseController
};
