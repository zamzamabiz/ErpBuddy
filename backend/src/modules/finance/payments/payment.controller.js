const paymentService = require('./payment.service');
const { validateCreatePayment } = require('./payment.validation');

class PaymentController {
  /**
   * POST /api/payments - Create payment/receipt
   */
  async createPayment(req, res) {
    try {
      const { error, value } = validateCreatePayment(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const tenantId = req.user.tenantId;
      const userId = req.user._id;

      const payment = await paymentService.createPayment(tenantId, userId, value);

      res.status(201).json({
        success: true,
        message: `${value.type === 'payment' ? 'Payment' : 'Receipt'} created successfully`,
        data: payment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments - List payments
   */
  async listPayments(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { type, accountId, dateFrom, dateTo } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (accountId) filters.accountId = accountId;
      if (dateFrom || dateTo) {
        filters.dateFrom = dateFrom;
        filters.dateTo = dateTo;
      }

      const payments = await paymentService.listPayments(tenantId, filters);

      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/:id - Get payment detail
   */
  async getPayment(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const payment = await paymentService.getPaymentById(id, tenantId);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      if (error.message === 'Payment not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/payments/:id - Delete payment (soft delete)
   */
  async deletePayment(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await paymentService.deletePayment(id, tenantId);

      res.status(204).end();
    } catch (error) {
      if (error.message === 'Payment not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/:id/restore - Restore deleted payment
   */
  async restorePayment(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const payment = await paymentService.restorePayment(id, tenantId);

      res.status(200).json({
        success: true,
        message: 'Payment restored successfully',
        data: payment
      });
    } catch (error) {
      if (error.message === 'Deleted payment not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PaymentController();
