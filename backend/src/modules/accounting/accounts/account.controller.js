const mongoose = require('mongoose');
const AccountService = require('./account.service');
const Account = require('./account.model');
const { createDefaultChartOfAccounts } = require('./account.seed');
const { accountValidation } = require('./account.validation');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/apiResponse');

// ============================================
// ACCOUNT CONTROLLER - PRODUCTION GRADE
// ============================================

class AccountController {
  /**
   * CREATE ACCOUNT
   * POST /api/accounts
   */
  static createAccount = asyncHandler(async (req, res) => {
    const { error, value } = accountValidation.createAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', { details: error.details })
      );
    }

    const account = await AccountService.createAccount(
      value,
      req.user,
      req.tenantId
    );

    res.status(201).json(
      ApiResponse.success('Account created successfully', account)
    );
  });

  /**
   * GET ACCOUNTS (FLAT LIST)
   * GET /api/accounts
   */
  static listAccounts = asyncHandler(async (req, res) => {
    const { error, value } = accountValidation.listAccountsSchema.validate(req.query);
    if (error) {
      return res.status(400).json(
        ApiResponse.error('Invalid query parameters', { details: error.details })
      );
    }

    const result = await AccountService.listAccounts(req.tenantId, value);

    res.status(200).json(
      ApiResponse.success('Accounts retrieved successfully', result.data, {
        pagination: result.pagination
      })
    );
  });

  /**
   * GET ACCOUNT TREE (HIERARCHICAL)
   * GET /api/accounts/tree
   * Auto-seeds accounts if none exist for this tenant
   */
  static getAccountTree = asyncHandler(async (req, res) => {
    const { type } = req.query;

    if (!req.tenantId) {
      return res.status(400).json(
        ApiResponse.error('Tenant ID is required')
      );
    }

    // Ensure tenantId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.tenantId)) {
      return res.status(400).json(
        ApiResponse.error('Invalid Tenant ID format')
      );
    }
    const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);

    // Auto-seed if no accounts exist for this tenant
    const existingCount = await Account.countDocuments({ tenantId: tenantObjectId });
    if (existingCount === 0) {
      console.log(`Auto-seeding Chart of Accounts for tenant: ${tenantObjectId}`);
      await createDefaultChartOfAccounts(req.tenantId);
    }

    const tree = await AccountService.getAccountTree(req.tenantId, type);

    res.status(200).json(
      ApiResponse.success('Chart of accounts retrieved successfully', tree)
    );
  });

  /**
   * GET SINGLE ACCOUNT WITH HIERARCHY
   * GET /api/accounts/:id
   */
  static getAccount = asyncHandler(async (req, res) => {
    const account = await AccountService.getAccountWithHierarchy(
      req.params.id,
      req.tenantId
    );

    res.status(200).json(
      ApiResponse.success('Account retrieved successfully', account)
    );
  });

  /**
   * UPDATE ACCOUNT
   * PATCH /api/accounts/:id
   */
  static updateAccount = asyncHandler(async (req, res) => {
    const { error, value } = accountValidation.updateAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', { details: error.details })
      );
    }

    const account = await AccountService.updateAccount(
      req.params.id,
      value,
      req.tenantId,
      req.user
    );

    res.status(200).json(
      ApiResponse.success('Account updated successfully', account)
    );
  });

  /**
   * DISABLE ACCOUNT
   * PATCH /api/accounts/:id/disable
   */
  static disableAccount = asyncHandler(async (req, res) => {
    const { error, value } = accountValidation.disableAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', { details: error.details })
      );
    }

    const account = await AccountService.disableAccount(
      req.params.id,
      req.tenantId,
      req.user,
      value.reason
    );

    res.status(200).json(
      ApiResponse.success('Account disabled successfully', account)
    );
  });

  /**
   * GET ACCOUNTS BY TYPE
   * GET /api/accounts/type/:type
   */
  static getAccountsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;

    const accounts = await AccountService.getAccountsByType(req.tenantId, type);

    res.status(200).json(
      ApiResponse.success(`${type} accounts retrieved successfully`, accounts)
    );
  });
}

module.exports = AccountController;
