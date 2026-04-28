const express = require('express');
const paymentController = require('./payment.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const rbacMiddleware = require('../../../middleware/rbac.middleware');
const periodLock = require('../../../middleware/periodLock.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/payments - Create payment
router.post(
  '/',
  rbacMiddleware('payment', 'create'),
  periodLock,
  paymentController.createPayment.bind(paymentController)
);

// GET /api/payments - List payments
router.get(
  '/',
  rbacMiddleware('payment', 'read'),
  paymentController.listPayments.bind(paymentController)
);

// GET /api/payments/:id - Get payment detail
router.get(
  '/:id',
  rbacMiddleware('payment', 'read'),
  paymentController.getPayment.bind(paymentController)
);

// DELETE /api/payments/:id - Delete payment (soft delete)
router.delete(
  '/:id',
  rbacMiddleware('payment', 'delete'),
  periodLock,
  paymentController.deletePayment.bind(paymentController)
);

// POST /api/payments/:id/restore - Restore deleted payment
router.post(
  '/:id/restore',
  rbacMiddleware('payment', 'create'),
  paymentController.restorePayment.bind(paymentController)
);

module.exports = router;
