const Invoice = require('./invoice.model');
const Item = require('@modules/item/item.model');
const inventoryService = require('@modules/inventory/inventory.service');

class InvoiceService {
  /**
   * Generate next invoice number
   */
  async generateInvoiceNumber(type, tenantId) {
    try {
      // Get last invoice of this type for tenant
      const lastInvoice = await Invoice.findOne(
        { type, tenantId, deletedAt: null },
        { invoiceNumber: 1 },
        { sort: { createdAt: -1 } }
      ).lean();

      // Extract number from invoiceNumber (e.g., "SALE-0001" → 1)
      let nextNum = 1;
      if (lastInvoice) {
        const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }

      // Format: SALE-0001, PURCHASE-0001, etc.
      return `${type}-${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate and get item details
   */
  async validateItem(itemId, tenantId) {
    try {
      const item = await Item.findOne({
        _id: itemId,
        tenantId,
        deletedAt: null,
      });

      if (!item) {
        throw new Error(`Item not found or does not belong to this tenant`);
      }

      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new invoice (DRAFT)
   */
  async createInvoice(data, tenantId) {
    try {
      // Validate required fields
      if (!data.type || !['SALE', 'PURCHASE'].includes(data.type)) {
        throw new Error('Type must be SALE or PURCHASE');
      }

      if (!data.partyName) {
        throw new Error('Party name is required');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('Invoice must have at least one item');
      }

      // Validate each item and calculate totals
      let subtotal = 0;
      const validatedItems = [];

      for (const item of data.items) {
        // Validate item exists
        const itemRecord = await this.validateItem(item.itemId, tenantId);

        // Validate quantity and rate
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }

        if (item.rate === undefined || item.rate < 0) {
          throw new Error('Rate cannot be negative');
        }

        if (item.unit !== itemRecord.unit) {
          throw new Error(
            `Item ${itemRecord.name} requires unit ${itemRecord.unit}, got ${item.unit}`
          );
        }

        // Calculate amount
        const amount = item.quantity * item.rate;

        validatedItems.push({
          itemId: item.itemId,
          batchNo: item.batchNo || null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount,
        });

        subtotal += amount;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(
        data.type,
        tenantId
      );

      // Create invoice (DRAFT)
      const invoice = new Invoice({
        invoiceNumber,
        type: data.type,
        partyName: data.partyName,
        date: data.date || new Date(),
        items: validatedItems,
        subtotal,
        total: subtotal, // Taxes could be added here later
        status: 'DRAFT',
        tenantId,
      });

      return await invoice.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Post invoice = create inventory entries + mark as POSTED
   * CRITICAL: For SALE → OUT inventory, for PURCHASE → IN inventory
   */
  async postInvoice(invoiceId, tenantId) {
    try {
      // Get invoice
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId,
        deletedAt: null,
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'POSTED') {
        throw new Error('Invoice is already posted');
      }

      // Determine transaction type and reference type
      const isDebit = invoice.type === 'SALE' ? 'OUT' : 'IN';
      const refType = invoice.type === 'SALE' ? 'SALE' : 'PURCHASE';

      // For SALE invoices: validate stock availability
      if (invoice.type === 'SALE') {
        for (const item of invoice.items) {
          const stock = await inventoryService.getStockByItem(
            item.itemId,
            tenantId
          );

          if (stock.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for item. Available: ${stock.currentStock}, Required: ${item.quantity}`
            );
          }
        }
      }

      // Create inventory entries for each item
      for (const item of invoice.items) {
        await inventoryService.createEntry(
          {
            itemId: item.itemId,
            batchNo: item.batchNo,
            quantity: item.quantity,
            unit: item.unit,
            transactionType: isDebit,
            referenceType: refType,
            referenceId: invoice._id.toString(),
            date: invoice.date,
            notes: `${refType} Invoice: ${invoice.invoiceNumber}`,
          },
          tenantId
        );
      }

      // Mark invoice as POSTED
      invoice.status = 'POSTED';
      return await invoice.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all invoices for tenant (with optional filters)
   */
  async getInvoices(tenantId, filters = {}) {
    try {
      const query = { tenantId, deletedAt: null };

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      const invoices = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return invoices;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id, tenantId) {
    try {
      const invoice = await Invoice.findOne({
        _id: id,
        tenantId,
        deletedAt: null,
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InvoiceService();
