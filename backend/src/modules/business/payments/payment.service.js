const BaseService = require('../../../shared/base.service');
const PaymentRepository = require('./payment.repository');
const Payment = require('./payment.model');
const journalService = require('../../finance/journal/journal.service');
const coreEngine = require('../../engines/coreEngine/coreEngine.service');

class PaymentService extends BaseService {
  constructor() {
    super(PaymentRepository);
  }

  async create(data, user) {
    const paymentData = {
      ...data,
      createdBy: user._id,
      status: 'Draft'
    };

    const payment = await this.repository.create(paymentData);
    return payment;
  }

  async findAll(filter = {}) {
    return await Payment.find(filter)
      .populate('party')
      .populate('account')
      .populate('partyAccountId')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    try {
      const payment = await Payment.findById(id)
        .populate('party')
        .populate('account')
        .populate('partyAccountId');
      return payment;
    } catch (err) {
      console.error('❌ Payment findById Error:', err.message);
      throw new Error(`Failed to fetch payment: ${err.message}`);
    }
  }

  async post(id, user) {
    const company = user.company || user.companyId;
    const userId = user._id;

    // ✅ STEP 1: Atomic lock — only proceed if status is Draft
    const payment = await Payment.findOneAndUpdate(
      {
        _id: id,
        company,
        status: 'Draft', // 🔒 Condition ensures only Draft documents can proceed
      },
      {
        status: 'Posting', // Temporary lock state (prevents concurrent execution)
        updatedAt: new Date(),
      },
      { new: true }
    );

    // If query returned null, document either:
    // - Doesn't exist
    // - Not owned by this company
    // - Already posted (status ≠ Draft)
    if (!payment) {
      throw new Error('Payment already posted or not found');
    }

    try {
      // ✅ STEP 2: Validate required fields for journal creation
      if (!payment.partyAccountId) {
        throw new Error('Party account is required for posting');
      }
      if (!payment.account) {
        throw new Error('Cash/Bank account is required for posting');
      }

      // ✅ STEP 3: Create Journal Entry based on payment type
      let journalId = null;

      try {
        let journalLines = [];

        if (payment.paymentType === 'Payment' && payment.partyType === 'Supplier') {
          // 🔴 SUPPLIER PAYMENT: Reduce Payable, Reduce Cash
          // Dr: Supplier Account (Payable) | Cr: Cash/Bank Account
          journalLines = [
            {
              accountId: payment.partyAccountId,
              debit: payment.amount, // Reduce supplier payable
              credit: 0,
              description: `Payment to Supplier: ${payment.referenceNumber || payment.paymentNumber}`,
            },
            {
              accountId: payment.account,
              debit: 0,
              credit: payment.amount, // Reduce cash
              description: `Cash Payment: ${payment.referenceNumber || payment.paymentNumber}`,
            },
          ];
        } else if (payment.paymentType === 'Receipt' && payment.partyType === 'Customer') {
          // 🟢 CUSTOMER RECEIPT: Increase Cash, Reduce Receivable
          // Dr: Cash/Bank Account | Cr: Customer Account (Receivable)
          journalLines = [
            {
              accountId: payment.account,
              debit: payment.amount, // Increase cash
              credit: 0,
              description: `Receipt from Customer: ${payment.referenceNumber || payment.paymentNumber}`,
            },
            {
              accountId: payment.partyAccountId,
              debit: 0,
              credit: payment.amount, // Reduce customer receivable
              description: `Customer Receipt: ${payment.referenceNumber || payment.paymentNumber}`,
            },
          ];
        } else {
          throw new Error(
            `Invalid payment type combination: ${payment.paymentType} / ${payment.partyType}`
          );
        }

        // 🔵 Route through Core Engine for centralized transaction processing
        const coreEngineResult = await coreEngine.processTransaction('PAYMENT', {
          tenantId: company,
          userId,
          reference: payment.paymentNumber,
          date: payment.paymentDate,
          journalLines: journalLines,
        });
        journalId = coreEngineResult.journal._id;
      } catch (err) {
        console.error('❌ Journal creation failed:', err.message);
        throw err; // Propagate error to trigger rollback
      }

      // ✅ STEP 4: Finalize posting — update status from Posting → Posted
      const postedPayment = await Payment.findOneAndUpdate(
        { _id: id, company },
        {
          status: 'Posted',
          journalId: journalId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return postedPayment;

    } catch (error) {
      // ✅ STEP 5: Rollback lock if any failure occurs
      // Revert status from Posting → Draft so user can retry
      await Payment.findOneAndUpdate(
        { _id: id, company },
        { status: 'Draft' }
      );

      throw error;
    }
  }
}

module.exports = new PaymentService();
