const express = require('express');
const router = express.Router();
const AccountController = require('./account.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

// ============================================
// ACCOUNT ROUTES - PRODUCTION GRADE
// ============================================

/**
 * GET /accounts/tree
 * Get hierarchical chart of accounts
 * No specific permission needed - only authentication
 */
router.get('/tree', authMiddleware, AccountController.getAccountTree);

/**
 * GET /accounts/type/:type
 * Get accounts by type (Asset, Liability, etc.)
 */
router.get('/type/:type', authMiddleware, AccountController.getAccountsByType);

/**
 * GET /accounts
 * List all accounts with filters and pagination
 */
router.get('/', authMiddleware, AccountController.listAccounts);

/**
 * GET /accounts/:id
 * Get single account with hierarchy
 */
router.get('/:id', authMiddleware, AccountController.getAccount);

/**
 * POST /accounts
 * Create new account
 */
router.post('/', authMiddleware, AccountController.createAccount);

/**
 * PATCH /accounts/:id
 * Update account details
 */
router.patch('/:id', authMiddleware, AccountController.updateAccount);

/**
 * PATCH /accounts/:id/disable
 * Disable account (NOT delete)
 */
router.patch('/:id/disable', authMiddleware, AccountController.disableAccount);

module.exports = router;
