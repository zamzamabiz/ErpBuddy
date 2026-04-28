const RiceLot = require('../models/riceLot.model');
const mongoose = require('mongoose');

/**
 * Create a new rice lot
 * POST /api/rice-lots
 */
const createLot = async (req, res) => {
  try {
    const {
      lotNumber,
      supplier,
      purchaseDate,
      purchasePricePerTon,
      quantityTons,
      storageLocation,
      quality,
      moisture,
      notes
    } = req.body;

    // Validate required fields
    if (!lotNumber || !supplier || !purchaseDate || !purchasePricePerTon || !quantityTons) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lotNumber, supplier, purchaseDate, purchasePricePerTon, quantityTons'
      });
    }

    const lot = new RiceLot({
      lotNumber,
      tenantId: req.tenantId,
      supplier,
      purchaseDate: new Date(purchaseDate),
      purchasePricePerTon,
      quantityTons,
      storageLocation,
      quality,
      moisture,
      notes,
      createdBy: req.user._id || req.user.id
    });

    await lot.save();

    res.status(201).json({
      success: true,
      message: 'Rice lot created successfully',
      data: lot
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lot number already exists',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create rice lot',
      error: error.message
    });
  }
};

/**
 * Get all lots for current tenant with pagination and filtering
 * GET /api/rice-lots
 */
const getAllLots = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const tenantId = req.tenantId;

    // Build filter
    const filter = { tenantId };
    if (status) {
      filter.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const lots = await RiceLot.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name email');

    // Get total count
    const total = await RiceLot.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Rice lots retrieved successfully',
      data: lots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rice lots',
      error: error.message
    });
  }
};

/**
 * Get single lot by ID
 * GET /api/rice-lots/:id
 */
const getLotById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lot ID'
      });
    }

    const lot = await RiceLot.findOne({ _id: id, tenantId })
      .populate('createdBy', 'name email');

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Rice lot not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rice lot retrieved successfully',
      data: lot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rice lot',
      error: error.message
    });
  }
};

/**
 * Update lot by ID
 * PUT /api/rice-lots/:id
 */
const updateLot = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const updateData = req.body;

    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lot ID'
      });
    }

    // Find existing lot
    const existingLot = await RiceLot.findOne({ _id: id, tenantId });

    if (!existingLot) {
      return res.status(404).json({
        success: false,
        message: 'Rice lot not found'
      });
    }

    // Prevent updating quantityTons if sales already made
    if (updateData.quantityTons !== undefined) {
      if (existingLot.remainingQuantity < existingLot.quantityTons) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update quantity after sales have been made'
        });
      }
    }

    // Update the lot
    const updatedLot = await RiceLot.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Rice lot updated successfully',
      data: updatedLot
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lot number already exists',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update rice lot',
      error: error.message
    });
  }
};

/**
 * Delete lot (soft delete or remove if no transactions)
 * DELETE /api/rice-lots/:id
 */
const deleteLot = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lot ID'
      });
    }

    const lot = await RiceLot.findOne({ _id: id, tenantId });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Rice lot not found'
      });
    }

    // If no sales made (remainingQuantity equals original quantity), hard delete
    if (lot.remainingQuantity === lot.quantityTons) {
      await RiceLot.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: 'Rice lot deleted successfully (no transactions existed)'
      });
    }

    // Otherwise, soft delete by marking as deleted or setting quantity to 0
    lot.remainingQuantity = 0;
    lot.status = 'Sold Out';
    await lot.save();

    res.status(200).json({
      success: true,
      message: 'Rice lot marked as deleted (had existing transactions)',
      data: lot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete rice lot',
      error: error.message
    });
  }
};

/**
 * Sell from a lot and calculate profit
 * POST /api/rice-lots/:id/sell
 */
const sellFromLot = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { quantitySold, sellingPricePerTon } = req.body;

    // Validate required fields
    if (!quantitySold || !sellingPricePerTon) {
      return res.status(400).json({
        success: false,
        message: 'quantitySold and sellingPricePerTon are required'
      });
    }

    // Validate positive quantities
    if (quantitySold <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity sold must be positive'
      });
    }

    if (sellingPricePerTon < 0) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be negative'
      });
    }

    // Verify ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lot ID'
      });
    }

    // Find the lot
    const lot = await RiceLot.findOne({ _id: id, tenantId });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Rice lot not found'
      });
    }

    // Check if enough quantity available
    if (quantitySold > lot.remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${lot.remainingQuantity} tons available for sale`
      });
    }

    // Execute sale
    const profitDetails = lot.sell(quantitySold, sellingPricePerTon);

    // Save the updated lot
    await lot.save();

    res.status(200).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        lot: lot,
        saleDetails: profitDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process sale',
      error: error.message
    });
  }
};

/**
 * Get available lots for current tenant
 * GET /api/rice-lots/available
 */
const getAvailableLots = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const lots = await RiceLot.findAvailableLots(tenantId)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Available lots retrieved successfully',
      data: lots,
      count: lots.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available lots',
      error: error.message
    });
  }
};

/**
 * Get total inventory value for current tenant
 * GET /api/rice-lots/inventory-value
 */
const getInventoryValue = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const totalValue = await RiceLot.getTotalInventoryValue(tenantId);

    res.status(200).json({
      success: true,
      message: 'Inventory value calculated successfully',
      data: {
        totalValue,
        tenantId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate inventory value',
      error: error.message
    });
  }
};

/**
 * Get profit summary for date range
 * GET /api/rice-lots/profit-summary
 */
const getProfitSummary = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate } = req.query;

    const summary = await RiceLot.getProfitSummary(tenantId, startDate, endDate);

    res.status(200).json({
      success: true,
      message: 'Profit summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profit summary',
      error: error.message
    });
  }
};

module.exports = {
  createLot,
  getAllLots,
  getLotById,
  updateLot,
  deleteLot,
  sellFromLot,
  getAvailableLots,
  getInventoryValue,
  getProfitSummary
};