const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const periodLock = require('../../../middleware/periodLock.middleware');
const JournalController = require('./journal.controller');

/**
 * JOURNAL ROUTES
 * All routes require authentication (multi-tenant isolation via authMiddleware)
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/journal/create
 * Create manual journal entry
 */
router.post('/create', periodLock, JournalController.createJournal);

/**
 * POST /api/journal/sale
 * Auto-post from sales invoice
 */
router.post('/sale', periodLock, JournalController.postSaleJournal);

/**
 * POST /api/journal/purchase
 * Auto-post from purchase bill
 */
router.post('/purchase', periodLock, JournalController.postPurchaseJournal);

/**
 * GET /api/journal
 * List journals with filters
 */
router.get('/', JournalController.listJournals);

/**
 * GET /api/journal/by-source/:sourceId
 * Retrieve journal entries linked to a purchase/sale/transaction
 */
router.get('/by-source/:sourceId', JournalController.getJournalBySourceId);

/**
 * GET /api/journal/:id
 * Retrieve journal with entries
 */
router.get('/:id', JournalController.getJournal);

/**
 * POST /api/journal/:id/post
 * Publish draft journal
 */
router.post('/:id/post', periodLock, JournalController.postJournal);

/**
 * DELETE /api/journal/:id
 * Delete draft journal
 */
router.delete('/:id', periodLock, JournalController.deleteJournal);

/**
 * POST /api/journal/:id/restore
 * Restore deleted journal
 */
router.post('/:id/restore', JournalController.restoreJournal);

module.exports = router;
