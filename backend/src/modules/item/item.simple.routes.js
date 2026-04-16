const express = require('express');
const router = express.Router();
const Item = require('./item.model');

// GET /api/items/simple - Get all items
router.get('/simple', async (req, res) => {
  try {
    const items = await Item.find().select('name category unit currentStock').limit(100);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/items/simple - Create item
router.post('/simple', async (req, res) => {
  try {
    const { name, category, unit } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Item name is required' });
    }

    const item = new Item({
      name,
      category: category || 'General',
      categoryId: '69dd0cb31c5468a5b63511b7',  // Add required categoryId
      sku: `ITEM-${Date.now()}`,  // Add unique SKU to avoid duplicate key error
      unit: unit || 'PCS',
      currentStock: 0,
      companyId: '69dd0cb31c5468a5b63511b7',
      tenantId: '69dd0cb31c5468a5b63511b7'
    });

    await item.save();
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;