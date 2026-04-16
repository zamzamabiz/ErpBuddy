/**
 * ✅ CORE TRANSACTION ENGINE
 * 
 * Centralized entry point for all business transactions:
 * - Purchase
 * - Sales
 * - Payment
 * 
 * Future plans:
 * - Inventory coordination
 * - Event emission
 * - Audit trail integration
 */

const journalService = require('../../finance/journal/journal.service');

class CoreEngine {
  /**
   * Main dispatcher for all transaction types
   * @param {String} type - Transaction type (PURCHASE, SALE, PAYMENT)
   * @param {Object} data - Transaction data with journalLines, etc.
   * @returns {Object} - Result containing journal, inventory, etc.
   */
  async processTransaction(type, data) {
    console.log(`🔵 Core Engine: Processing ${type}`);

    switch (type) {
      case 'PURCHASE':
        return await this.handlePurchase(data);

      case 'SALE':
        return await this.handleSale(data);

      case 'PAYMENT':
        return await this.handlePayment(data);

      case 'COGS':
        return await this.handleCOGS(data);

      default:
        throw new Error(`❌ Core Engine: Unsupported transaction type: ${type}`);
    }
  }

  /**
   * ========================
   * PURCHASE HANDLER
   * ========================
   * 
   * Flow:
   * 1. Create journal entry (Expense Dr / Payable Cr)
   * 2. [Future] Create inventory transaction
   * 3. [Future] Emit PURCHASE_POSTED event
   * 4. [Future] Update audit log
   */
  async handlePurchase(data) {
    try {
      console.log(`  ↳ 📥 Handling PURCHASE: ${data.reference}`);

      if (!data.journalLines || data.journalLines.length === 0) {
        throw new Error('Journal lines are required for purchase');
      }

      // ✅ Step 1: Create journal entry via existing journalService
      const journal = await journalService.createJournal(data.tenantId, data.userId, {
        date: data.date,
        description: `Purchase: ${data.reference}`,
        lines: data.journalLines,
      });

      console.log(`  ✅ Journal created: ${journal._id}`);

      // [Future] Step 2: Create inventory transaction
      // const inventory = await inventoryEngine.recordPurchase(data);

      // [Future] Step 3: Emit event
      // EventEmitter.emit('PURCHASE_POSTED', { purchaseId, journal });

      // [Future] Step 4: Audit log
      // await auditLog.log('PURCHASE_POSTED', ...);

      return {
        success: true,
        type: 'PURCHASE',
        journal,
        inventory: null, // [Future] will be populated
      };

    } catch (error) {
      console.error(`  ❌ Purchase handler failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ========================
   * SALES HANDLER
   * ========================
   * 
   * Flow:
   * 1. Create journal entry (AR Dr / Sales Cr + COGS/Inv lines)
   * 2. [Future] Create inventory transaction
   * 3. [Future] Emit SALES_POSTED event
   * 4. [Future] Update audit log
   */
  async handleSale(data) {
    try {
      console.log(`  ↳ 🔴 Handling SALE: ${data.reference}`);

      if (!data.journalLines || data.journalLines.length === 0) {
        throw new Error('Journal lines are required for sale');
      }

      // ✅ Step 1: Create journal entry via existing journalService
      const journal = await journalService.createJournal(data.tenantId, data.userId, {
        date: data.date,
        description: `Sale: ${data.reference}`,
        lines: data.journalLines,
      });

      console.log(`  ✅ Journal created: ${journal._id}`);

      // [Future] Step 2: Create inventory transaction
      // const inventory = await inventoryEngine.recordSale(data);

      // [Future] Step 3: Emit event
      // EventEmitter.emit('SALES_POSTED', { saleId, journal });

      // [Future] Step 4: Audit log
      // await auditLog.log('SALES_POSTED', ...);

      return {
        success: true,
        type: 'SALE',
        journal,
        inventory: null, // [Future] will be populated
      };

    } catch (error) {
      console.error(`  ❌ Sales handler failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ========================
   * PAYMENT HANDLER
   * ========================
   * 
   * Flow:
   * 1. Create journal entry (Payable or Receivable lines)
   * 2. [Future] Create payment allocation record
   * 3. [Future] Emit PAYMENT_POSTED event
   * 4. [Future] Update audit log
   */
  async handlePayment(data) {
    try {
      console.log(`  ↳ 💳 Handling PAYMENT: ${data.reference}`);

      if (!data.journalLines || data.journalLines.length === 0) {
        throw new Error('Journal lines are required for payment');
      }

      // ✅ Step 1: Create journal entry via existing journalService
      const journal = await journalService.createJournal(data.tenantId, data.userId, {
        date: data.date,
        description: `Payment: ${data.reference}`,
        lines: data.journalLines,
      });

      console.log(`  ✅ Journal created: ${journal._id}`);

      // [Future] Step 2: Create payment allocation
      // const allocation = await paymentEngine.allocatePayment(data);

      // [Future] Step 3: Emit event
      // EventEmitter.emit('PAYMENT_POSTED', { paymentId, journal });

      // [Future] Step 4: Audit log
      // await auditLog.log('PAYMENT_POSTED', ...);

      return {
        success: true,
        type: 'PAYMENT',
        journal,
        allocation: null, // [Future] will be populated
      };

    } catch (error) {
      console.error(`  ❌ Payment handler failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ========================
   * COGS HANDLER
   * ========================
   * 
   * Flow:
   * 1. Create COGS journal entry (COGS Expense Dr / Inventory Cr)
   * 2. Records cost of goods sold using FIFO method
   * 3. Integrates with inventory system
   */
  async handleCOGS(data) {
    try {
      console.log(`  ↳ 📊 Handling COGS: ${data.reference}`);

      if (!data.journalLines || data.journalLines.length === 0) {
        throw new Error('Journal lines are required for COGS');
      }

      if (data.amount <= 0) {
        console.log(`  ⚠️  Skip COGS: Amount is 0`);
        return {
          success: true,
          type: 'COGS',
          journal: null,
          skipped: true,
        };
      }

      // ✅ Step 1: Create journal entry via existing journalService
      const journal = await journalService.createJournal(data.tenantId, data.userId, {
        date: data.date,
        description: `COGS: ${data.reference}`,
        lines: data.journalLines,
      });

      console.log(`  ✅ COGS Journal created: ${journal._id}, Amount: ${data.amount}`);

      return {
        success: true,
        type: 'COGS',
        journal,
        amount: data.amount,
      };

    } catch (error) {
      console.error(`  ❌ COGS handler failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * [Future] Utility: Get transaction status
   */
  async getTransactionStatus(journalId) {
    // Placeholder for future implementation
    return { journal: journalId, status: 'posted' };
  }

  /**
   * [Future] Utility: Reverse transaction
   */
  async reverseTransaction(journalId, userId) {
    // Placeholder for future implementation
    throw new Error('Reversal not yet implemented');
  }
}

module.exports = new CoreEngine();
