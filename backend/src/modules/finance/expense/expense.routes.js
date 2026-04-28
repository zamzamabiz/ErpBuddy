const express = require('express');
const router = express.Router();
const expenseController = require('./expense.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

/**
 * EXPENSE ROUTES
 * All routes require authentication and tenant context
 */

// Apply auth middleware to all expense routes
router.use(authMiddleware);

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense with automatic journal entry
 * @access  Private
 */
router.post('/', expenseController.createExpense);

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses for current tenant
 * @access  Private
 */
router.get('/', expenseController.getAllExpenses);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get('/:id', expenseController.getExpenseById);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense (soft delete)
 * @access  Private
 */
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;