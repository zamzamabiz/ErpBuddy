const Payment = require('./payment.model');
const PaymentRepository = require('./payment.repository');
const documentNumberService = require('../../engines/documentNumbering/documentNumber.service');
const journalService = require('../journal/journal.service');
const Account = require('../../accounting/accounts/account.model');

class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
  }
  /**
   * Create payment/receipt with auto journal entry
   */
  async createPayment(tenantId, userId, data) {
    const { date, type, cashAccountId, counterAccountId, amount, description } = data;

    // Validate inputs
    if (!date) throw new Error('Date is required');
    if (!type || !['payment', 'receipt'].includes(type)) {
      throw new Error('Type must be "payment" or "receipt"');
    }
    if (!cashAccountId) throw new Error('Cash/Bank account is required');
    if (!counterAccountId) throw new Error('Expense/Revenue account is required');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

    // Verify both accounts exist
    const cashAccount = await Account.findOne({ _id: cashAccountId }).lean();
    if (!cashAccount) throw new Error('Cash/Bank account not found');

    const counterAccount = await Account.findOne({ _id: counterAccountId }).lean();
    if (!counterAccount) throw new Error('Expense/Revenue account not found');

    // Generate document number
    const reference = await documentNumberService.generateDocumentNumber('payment', tenantId);

    // Check for duplicate reference
    const exists = await this.paymentRepository.findByReference(reference, tenantId);
    if (exists) {
      throw new Error('Payment reference already exists. Please try again.');
    }

    // Create payment
    const paymentData = {
      tenantId,
      date: new Date(date),
      reference,
      type,
      cashAccountId,
      counterAccountId,
      amount,
      description: description || '',
      createdBy: userId
    };

    const payment = await this.paymentRepository.createPayment(paymentData);

    // Auto-create journal entry
    try {
      const journalLines = this._generateJournalLines(type, cashAccountId, counterAccountId, amount);
      const journalEntry = await journalService.createJournal(tenantId, userId, {
        date: new Date(date),
        description: `${type === 'payment' ? 'Payment' : 'Receipt'}: ${reference}`,
        lines: journalLines
      });

      // Link payment to journal
      // Note: updatePaymentWithJournal may not exist in repository, update directly
      await Payment.findByIdAndUpdate(payment._id, { journalId: journalEntry._id });

      // Return payment with journal info
      payment.journalId = journalEntry._id;
    } catch (err) {
      // Log error but don't fail payment creation
      console.error('Failed to auto-create journal entry:', err.message);
    }

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId, tenantId) {
    const payment = await this.paymentRepository.findPaymentById(paymentId, tenantId);
    if (!payment) throw new Error('Payment not found');
    return payment;
  }

  /**
   * List payments
   */
  async listPayments(tenantId, filters = {}) {
    return this.paymentRepository.listPayments(tenantId, filters);
  }

  /**
   * Generate journal lines based on payment type
   * Payment (OUT): Debit counterAccount (Expense/Payable), Credit cashAccount
   * Receipt (IN): Debit cashAccount, Credit counterAccount (Revenue/Receivable)
   *
   * @private
   */
  _generateJournalLines(type, cashAccountId, counterAccountId, amount) {
    if (type === 'payment') {
      // Payment OUT: Debit Expense/Payable, Credit Cash/Bank
      return [
        {
          accountId: counterAccountId,
          debit: amount,
          credit: 0,
          description: 'Expense/Payable'
        },
        {
          accountId: cashAccountId,
          debit: 0,
          credit: amount,
          description: 'Cash/Bank'
        }
      ];
    } else {
      // Receipt IN: Debit Cash/Bank, Credit Revenue/Receivable
      return [
        {
          accountId: cashAccountId,
          debit: amount,
          credit: 0,
          description: 'Cash/Bank'
        },
        {
          accountId: counterAccountId,
          debit: 0,
          credit: amount,
          description: 'Revenue/Receivable'
        }
      ];
    }
  }
  /**
   * Delete payment (soft delete)
   */
  async deletePayment(paymentId, tenantId) {
    const payment = await this.paymentRepository.findPaymentById(paymentId, tenantId);
    if (!payment) throw new Error('Payment not found');
    return Payment.findByIdAndUpdate(paymentId, { deletedAt: new Date() }, { new: true });
  }

  /**
   * Restore deleted payment
   */
  async restorePayment(paymentId, tenantId) {
    const payment = await Payment.findOne({ _id: paymentId, tenantId, deletedAt: { $ne: null } }).lean();
    if (!payment) throw new Error('Deleted payment not found');
    return Payment.findByIdAndUpdate(paymentId, { deletedAt: null }, { new: true });
  }
}

module.exports = PaymentService;
