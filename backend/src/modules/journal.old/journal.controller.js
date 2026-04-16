const JournalService = require('./journal.service');
const asyncHandler = require('@utils/asyncHandler');
const apiResponse = require('@utils/apiResponse');

/**
 * JOURNAL CONTROLLER - HTTP Request Handlers
 */

/**
 * CREATE MANUAL JOURNAL ENTRY
 * POST /api/journals/create
 */
exports.createJournal = asyncHandler(async (req, res) => {
  const { entries, reference, description } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user._id;

  // Validate request
  if (!entries || !Array.isArray(entries) || entries.length < 2) {
    return res.status(400).json(
      apiResponse({
        success: false,
        message: 'Journal must have at least 2 entries'
      })
    );
  }

  // Create journal
  const result = await JournalService.createJournal({
    tenantId,
    entries,
    reference: reference || `MJ-${Date.now()}`,
    description: description || '',
    source: 'MANUAL',
    createdBy: userId
  });

  res.status(201).json(
    apiResponse({
      success: true,
      message: 'Journal entry created successfully',
      data: result
    })
  );
});

/**
 * POST SALE JOURNAL (Auto-posting from Sales Invoice)
 * POST /api/journals/sale
 */
exports.postSaleJournal = asyncHandler(async (req, res) => {
  const { saleId, customerAccountId, revenueAccountId, amount, reference } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user._id;

  // Validate request
  if (!saleId || !customerAccountId || !revenueAccountId || !amount) {
    return res.status(400).json(
      apiResponse({
        success: false,
        message: 'Missing required fields: saleId, customerAccountId, revenueAccountId, amount'
      })
    );
  }

  // Post journal
  const result = await JournalService.postSaleJournal({
    tenantId,
    saleId,
    customerAccountId,
    revenueAccountId,
    amount,
    reference: reference || saleId,
    createdBy: userId
  });

  res.status(201).json(
    apiResponse({
      success: true,
      message: 'Sale journal posted successfully',
      data: result
    })
  );
});

/**
 * POST PURCHASE JOURNAL (Auto-posting from Purchase Bill)
 * POST /api/journals/purchase
 */
exports.postPurchaseJournal = asyncHandler(async (req, res) => {
  const { purchaseId, expenseAccountId, supplierAccountId, amount, reference } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user._id;

  // Validate request
  if (!purchaseId || !expenseAccountId || !supplierAccountId || !amount) {
    return res.status(400).json(
      apiResponse({
        success: false,
        message: 'Missing required fields: purchaseId, expenseAccountId, supplierAccountId, amount'
      })
    );
  }

  // Post journal
  const result = await JournalService.postPurchaseJournal({
    tenantId,
    purchaseId,
    expenseAccountId,
    supplierAccountId,
    amount,
    reference: reference || purchaseId,
    createdBy: userId
  });

  res.status(201).json(
    apiResponse({
      success: true,
      message: 'Purchase journal posted successfully',
      data: result
    })
  );
});

/**
 * GET JOURNAL WITH ENTRIES
 * GET /api/journals/:id
 */
exports.getJournal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;

  const journal = await JournalService.getJournal(id, tenantId);

  res.status(200).json(
    apiResponse({
      success: true,
      message: 'Journal retrieved',
      data: journal
    })
  );
});

/**
 * LIST JOURNALS
 * GET /api/journals?status=POSTED&source=SALE&skip=0&limit=50
 */
exports.listJournals = asyncHandler(async (req, res) => {
  const { status, source, skip = 0, limit = 50 } = req.query;
  const tenantId = req.tenantId;

  const result = await JournalService.listJournals(tenantId, {
    status: status || null,
    source: source || null,
    skip: parseInt(skip),
    limit: parseInt(limit)
  });

  res.status(200).json(
    apiResponse({
      success: true,
      message: 'Journals retrieved',
      data: result
    })
  );
});

/**
 * GET JOURNAL BY SOURCE ID
 * GET /api/journals/by-source/:sourceId
 * Returns journal entries linked to a purchase, sale, or other transaction
 */
exports.getJournalBySourceId = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const tenantId = req.tenantId;

  const journal = await JournalService.getJournalsBySourceId(sourceId, tenantId);

  if (!journal) {
    return res.status(404).json(
      apiResponse({
        success: false,
        message: 'No journal found for this transaction'
      })
    );
  }

  res.status(200).json(
    apiResponse({
      success: true,
      message: 'Journal retrieved',
      data: journal
    })
  );
});

/**
 * POST (PUBLISH) JOURNAL - Mark draft as posted
 * POST /api/journals/:id/post
 */
exports.postJournal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.user._id;

  const result = await JournalService.postJournal(id, tenantId, userId);

  res.status(200).json(
    apiResponse({
      success: true,
      message: 'Journal posted successfully',
      data: result
    })
  );
});

/**
 * DELETE JOURNAL (only if DRAFT)
 * DELETE /api/journals/:id
 */
exports.deleteJournal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.user._id;

  const result = await JournalService.deleteJournal(id, tenantId, userId);

  res.status(200).json(
    apiResponse({
      success: true,
      message: 'Journal deleted',
      data: result
    })
  );
});
