const express = require('express');
const InvoiceController = require('./invoice.controller');
const authMiddleware = require('@middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/invoices
 * Create new invoice (DRAFT)
 */
router.post('/', authMiddleware, InvoiceController.createInvoice);

/**
 * POST /api/invoices/:id/post
 * Post invoice (create inventory entries, mark as POSTED)
 * CRITICAL: Integrates with Inventory Module
 */
router.post('/:id/post', authMiddleware, InvoiceController.postInvoice);

/**
 * GET /api/invoices
 * Get all invoices (with optional type and status filters)
 * Query params: type=SALE|PURCHASE, status=DRAFT|POSTED
 */
router.get('/', authMiddleware, InvoiceController.getInvoices);

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', authMiddleware, InvoiceController.getInvoiceById);

module.exports = router;
