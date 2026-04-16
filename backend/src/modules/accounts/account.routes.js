const express = require('express');
const router = express.Router();
const AccountController = require('./account.controller');
const { checkPermission } = require('../../middleware/rbac.middleware');

// ============================================
// ACCOUNT ROUTES
// ============================================

/**
 * GET /accounts/tree
 * Get hierarchical chart of accounts
 * Permission: account:read
 */
router.get('/tree', checkPermission('account', 'read'), AccountController.getAccountTree);

/**
 * GET /accounts/type/:type
 * Get accounts by type (Asset, Liability, etc.)
 * Permission: account:read
 */
router.get('/type/:type', checkPermission('account', 'read'), AccountController.getAccountsByType);

/**
 * GET /accounts
 * List all accounts with filters and pagination
 * Permission: account:read
 */
router.get('/', checkPermission('account', 'read'), AccountController.listAccounts);

/**
 * GET /accounts/:id
 * Get single account with hierarchy
 * Permission: account:read
 */
router.get('/:id', checkPermission('account', 'read'), AccountController.getAccount);

/**
 * POST /accounts
 * Create new account
 * Permission: account:create
 */
router.post('/', checkPermission('account', 'create'), AccountController.createAccount);

/**
 * PATCH /accounts/:id
 * Update account details
 * Permission: account:update
 */
router.patch('/:id', checkPermission('account', 'update'), AccountController.updateAccount);

/**
 * PATCH /accounts/:id/disable
 * Disable account (NOT delete)
 * Permission: account:delete (reusing delete permission for disable)
 */
router.patch('/:id/disable', checkPermission('account', 'delete'), AccountController.disableAccount);

module.exports = router;
