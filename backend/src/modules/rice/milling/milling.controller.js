const MillingService = require('./milling.service');

/**
 * MILLING CONTROLLER
 * Handles HTTP requests for milling operations
 */

/**
 * CREATE MILLING TRANSACTION
 * POST /api/rice/milling
 */
async function createMilling(req, res) {
  try {
    const result = await MillingService.createMilling(req.body, req);

    res.status(201).json({
      success: true,
      data: result.data,
      journal: result.journal,
      message: 'Milling transaction completed successfully'
    });
  } catch (error) {
    console.error('Milling controller error:', error);

    // Handle specific error types
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET MILLING BY ID
 * GET /api/rice/milling/:id
 */
async function getMillingById(req, res) {
  try {
    const milling = await MillingService.getMillingById(req.params.id, req);

    if (!milling) {
      return res.status(404).json({
        success: false,
        error: 'Milling record not found'
      });
    }

    res.json({
      success: true,
      data: milling
    });
  } catch (error) {
    console.error('Milling controller error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET ALL MILLINGS
 * GET /api/rice/milling
 */
async function getAllMillings(req, res) {
  try {
    const millings = await MillingService.getAllMillings(req);

    res.json({
      success: true,
      data: millings,
      count: millings.length
    });
  } catch (error) {
    console.error('Milling controller error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createMilling,
  getMillingById,
  getAllMillings
};