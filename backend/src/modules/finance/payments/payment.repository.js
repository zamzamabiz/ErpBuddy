const Payment = require('./payment.model');

class PaymentRepository {
  /**
   * Create a payment
   */
  async createPayment(paymentData) {
    const payment = new Payment(paymentData);
    return payment.save();
  }

  /**
   * Find payment by ID
   */
  async findPaymentById(paymentId, tenantId) {
    return Payment.findOne({
      _id: paymentId,
      tenantId,
      deletedAt: null
    })
      .populate('accountId', 'code name type')
      .populate('journalId')
      .lean();
  }

  /**
   * Find by reference
   */
  async findByReference(reference, tenantId) {
    return Payment.findOne({ reference, tenantId, deletedAt: null }).lean();
  }

  /**
   * List payments for a tenant
   */
  async listPayments(tenantId, filters = {}) {
    const query = { tenantId, deletedAt: null };

    if (filters.type) query.type = filters.type;
    if (filters.accountId) query.accountId = filters.accountId;
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }

    return Payment.find(query)
      .populate('accountId', 'code name type')
      .populate('journalId')
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  /**
   * Update payment with journal ID
   */
  async updatePaymentWithJournal(paymentId, tenantId, journalId) {
    return Payment.findOneAndUpdate(
      { _id: paymentId, tenantId },
      { journalId, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Check if reference exists (excluding deleted)
   */
  async referenceExists(reference, tenantId) {
    return Payment.findOne({ reference, tenantId, deletedAt: null }).lean();
  }

  /**
   * Delete payment (soft delete)
   */
  async deletePayment(paymentId, tenantId, userId) {
    return Payment.findOneAndUpdate(
      { _id: paymentId, tenantId, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Restore deleted payment
   */
  async restorePayment(paymentId, tenantId) {
    return Payment.findOneAndUpdate(
      { _id: paymentId, tenantId, deletedAt: { $ne: null } },
      { deletedAt: null, updatedAt: new Date() },
      { new: true }
    );
  }
  async getPaymentAccount(paymentId) {
    const payment = await Payment.findById(paymentId).lean();
    return payment?.accountId;
  }
}

module.exports = new PaymentRepository();
