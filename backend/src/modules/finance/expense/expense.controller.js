const expenseService = require('./expense.service');

/**
 * CREATE EXPENSE
 * POST /api/expenses
 */
async function createExpense(req, res) {
  try {
    const result = await expenseService.createExpense(req.body, req);
    res.status(201).json({
      success: true,
      data: result.data,
      journal: result.journal
    });
  } catch (error) {
    console.error('❌ Create expense error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET ALL EXPENSES
 * GET /api/expenses
 */
async function getAllExpenses(req, res) {
  try {
    const expenses = await expenseService.getAllExpenses(req);
    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('❌ Get expenses error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET EXPENSE BY ID
 * GET /api/expenses/:id
 */
async function getExpenseById(req, res) {
  try {
    const expense = await expenseService.getExpenseById(req.params.id, req);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('❌ Get expense error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * DELETE EXPENSE
 * DELETE /api/expenses/:id
 */
async function deleteExpense(req, res) {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Delete expense error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  deleteExpense
};