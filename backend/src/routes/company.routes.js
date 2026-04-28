const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const companyMiddleware = require('../middleware/company.middleware');

// Apply company middleware to all routes
router.use(companyMiddleware);

// GET /api/company/all - Get all companies
router.get('/all', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/company/:id - Get a single company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/company/create - Create a new company
router.post('/create', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Company email is required' });
    }

    const company = new Company({
      name,
      email,
      phone: phone || '',
      address: address || ''
    });

    await company.save();
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;