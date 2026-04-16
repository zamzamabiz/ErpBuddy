const invoiceService = require('./invoice.service');

class InvoiceController {
  /**
   * POST /api/invoices
   * Create new invoice (DRAFT)
   */
  static async createInvoice(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      const { type, partyName, items, date } = req.body;

      const invoice = await invoiceService.createInvoice(
        { type, partyName, items, date },
        tenantId
      );

      return res.status(201).json({
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('❌ Create invoice error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * POST /api/invoices/:id/post
   * Post invoice (create inventory entries, mark as POSTED)
   * CRITICAL: Inventory integration happens here
   */
  static async postInvoice(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { id } = req.params;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      if (!id) {
        return res
          .status(400)
          .json({ message: 'Invoice ID is required' });
      }

      const invoice = await invoiceService.postInvoice(id, tenantId);

      return res.status(200).json({
        message: 'Invoice posted successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('❌ Post invoice error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * GET /api/invoices
   * Get all invoices (with optional filters)
   */
  static async getInvoices(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { type, status } = req.query;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      const invoices = await invoiceService.getInvoices(tenantId, {
        type,
        status,
      });

      return res.status(200).json({
        message: 'Invoices retrieved successfully',
        count: invoices.length,
        data: invoices,
      });
    } catch (error) {
      console.error('❌ Get invoices error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * GET /api/invoices/:id
   * Get invoice by ID
   */
  static async getInvoiceById(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { id } = req.params;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      if (!id) {
        return res
          .status(400)
          .json({ message: 'Invoice ID is required' });
      }

      const invoice = await invoiceService.getInvoiceById(id, tenantId);

      return res.status(200).json({
        message: 'Invoice retrieved successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('❌ Get invoice error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }
}

module.exports = InvoiceController;
