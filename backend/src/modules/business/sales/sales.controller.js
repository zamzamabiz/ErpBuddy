const SalesService = require('./sales.service');
const validation = require('./sales.validation');
const mongoose = require('mongoose');

module.exports = {
  async create(req, res, next) {
    try {
      const data = await validation.create.validateAsync(req.body);
      const result = await SalesService.create(data, req.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async findAll(req, res, next) {
    try {
      const results = await SalesService.findAll(req.query);
      res.json(results);
    } catch (err) {
      next(err);
    }
  },

  async findById(req, res, next) {
    try {
      // Validate ObjectId format before DB query
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.warn('⚠️ Invalid Sale ID format:', req.params.id);
        return res.status(400).json({ message: 'Invalid sale ID format' });
      }

      // Pass user context to service for proper tenant/company filtering
      const result = await SalesService.findById(req.params.id, req.user);
      if (!result) return res.status(404).json({ message: 'Not found' });
      
      // 📌 DEBUG: Log response fields
      console.log('📊 Sale Response Fields:');
      console.log('  ✓ ID:', result._id);
      console.log('  ✓ Sales Number:', result.salesNumber);
      console.log('  ✓ Status:', result.status);
      console.log('  ✓ Total Amount:', result.totalAmount);
      console.log('  ✓ Items Count:', result.items?.length || 0);
      console.log('  ✓ Journal ID:', result.journalId ? result.journalId : 'NOT LINKED');
      
      res.json(result);
    } catch (err) {
      console.error('❌ Error fetching sale:', err.message);
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await validation.update.validateAsync(req.body);
      const result = await SalesService.update(req.params.id, data, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await SalesService.remove(req.params.id, req.user);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async restore(req, res, next) {
    try {
      const result = await SalesService.restore(req.params.id, req.user.tenantId, req.user._id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * 🔷 POST SALE
   * ========================
   * Business logic for posting sales:
   * ✅ Atomic lock to prevent concurrent posting
   * ✅ Validate all items
   * ✅ Create SR journal via postSaleJournal() or coreEngine
   * ✅ Calculate COGS per item
   * ✅ Create inventory entries
   * ✅ Create COGS journal
   * ✅ Finalize with status=Posted + journalId
   * ✅ Auto-rollback on any error
   */
  async post(req, res, next) {
    try {
      console.log(`\n🔵 Sale POST initiated for ID: ${req.params.id}`);
      
      // Business logic for posting sales (Document, Inventory, Journal)
      // The SalesService.post() method handles:
      // 1️⃣ Atomic locking to prevent duplicate posting
      // 2️⃣ Item validation (existence, type, active status)
      // 3️⃣ Journal posting via postSaleJournal (A/R + Sales Revenue)
      // 4️⃣ COGS calculation per item (using item-specific costing method)
      // 5️⃣ Stock ledger entries for inventory tracking
      // 6️⃣ COGS journal entry (COGS + Inventory accounts)
      // 7️⃣ Finalization with status=Posted + journalId
      // 8️⃣ Automatic rollback to Draft status on error
      
      const result = await SalesService.post(req.params.id, req.user);
      
      console.log(`✅ Sale posted successfully: ${result._id}`);
      res.json(result);
    } catch (err) {
      console.error('❌ Sale posting failed:', err.message);
      next(err);
    }
  }
};
