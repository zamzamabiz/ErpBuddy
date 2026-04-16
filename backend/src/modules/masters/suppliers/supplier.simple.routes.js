const express = require('express');
const router = express.Router();
const Supplier = require('./suppliers.model');

// GET /api/suppliers/simple - Get all suppliers
router.get('/simple', async (req, res) => {
  try {
    const suppliers = await Supplier.find().select('name contact email phone').limit(100);
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/suppliers/simple - Create supplier
router.post('/simple', async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Supplier name is required' });
    }

    const supplier = new Supplier({
      name,
      contact: contact || '',
      email: email || '',
      phone: phone || '',
      address: address || '',
      supplierCode: `SUP-${Date.now()}`,  // Generate unique supplier code
      tenantId: '69dd0cb31c5468a5b63511b7',  // Add required tenantId
      createdBy: '69dd0cb31c5468a5b63511b7',  // Add required createdBy
      companyId: '69dd0cb31c5468a5b63511b7'
    });

    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;