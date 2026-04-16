const express = require('express');
const router = express.Router();
const authMiddleware = require('@middleware/auth.middleware');
const JournalController = require('./journal.controller');

/**
 * JOURNAL ROUTES
 * All routes require authentication (multi-tenant isolation via authMiddleware)
 */

/**
 * POST /api/journals/create
 * Create manual journal entry
 */
router.post('/create', authMiddleware, JournalController.createJournal);

/**
 * POST /api/journals/sale
 * Auto-post from sales invoice
 */
router.post('/sale', authMiddleware, JournalController.postSaleJournal);

/**
 * POST /api/journals/purchase
 * Auto-post from purchase bill
 */
router.post('/purchase', authMiddleware, JournalController.postPurchaseJournal);

/**
 * GET /api/journals/by-source/:sourceId
 * Retrieve journal entries linked to a purchase/sale/transaction
 */
router.get('/by-source/:sourceId', authMiddleware, JournalController.getJournalBySourceId);

/**
 * GET /api/journals
 * List journals with filters
 */
router.get('/', authMiddleware, JournalController.listJournals);

/**
 * GET /api/journals/:id
 * Retrieve journal with entries
 */
router.get('/:id', authMiddleware, JournalController.getJournal);

/**
 * POST /api/journals/:id/post
 * Publish draft journal
 */
router.post('/:id/post', authMiddleware, JournalController.postJournal);

/**
 * DELETE /api/journals/:id
 * Delete draft journal
 */
router.delete('/:id', authMiddleware, JournalController.deleteJournal);

module.exports = router;
