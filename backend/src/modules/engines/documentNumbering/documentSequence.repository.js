const DocumentSequence = require('./documentSequence.model');

/**
 * Find or create document sequence for given tenant, module, and year
 * @param {ObjectId} tenantId - Tenant ID
 * @param {string} module - Module name (sales, purchase, etc.)
 * @param {number} year - Year
 * @returns {Object} Document sequence record
 */
async function findSequence(tenantId, module, year) {
  try {
    const sequence = await DocumentSequence.findOne({
      tenantId,
      module,
      year,
      isActive: true
    });
    return sequence;
  } catch (error) {
    throw new Error(`Repository: Error finding sequence - ${error.message}`);
  }
}

/**
 * Create new document sequence
 * @param {Object} data - Sequence data {tenantId, module, prefix, year, padding}
 * @returns {Object} Created sequence record
 */
async function createSequence(data) {
  try {
    const sequence = await DocumentSequence.create({
      tenantId: data.tenantId,
      module: data.module,
      prefix: data.prefix,
      year: data.year,
      padding: data.padding || 5,
      currentNumber: 0,
      isActive: true
    });
    return sequence;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - sequence already exists
      throw new Error('Sequence already exists for this tenant, module, and year');
    }
    throw new Error(`Repository: Error creating sequence - ${error.message}`);
  }
}

/**
 * Increment sequence atomically using $inc
 * CRITICAL: Uses findOneAndUpdate to ensure atomic operation (no duplicates)
 * @param {ObjectId} sequenceId - Sequence ID
 * @returns {Object} Updated sequence with new currentNumber
 */
async function incrementSequence(sequenceId) {
  try {
    const sequence = await DocumentSequence.findOneAndUpdate(
      { _id: sequenceId, isActive: true },
      { $inc: { currentNumber: 1 }, $set: { updatedAt: new Date() } },
      { new: true, upsert: false }
    );

    if (!sequence) {
      throw new Error('Sequence not found or is inactive');
    }

    return sequence;
  } catch (error) {
    throw new Error(`Repository: Error incrementing sequence - ${error.message}`);
  }
}

/**
 * Find sequence and increment in single operation (for safety)
 * CRITICAL: Atomic operation to prevent race conditions
 * @param {ObjectId} tenantId - Tenant ID
 * @param {string} module - Module name
 * @param {number} year - Year
 * @returns {Object} Updated sequence with new currentNumber
 */
async function findAndIncrement(tenantId, module, year) {
  try {
    const sequence = await DocumentSequence.findOneAndUpdate(
      { tenantId, module, year, isActive: true },
      { $inc: { currentNumber: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    if (!sequence) {
      throw new Error('Sequence not found');
    }

    return sequence;
  } catch (error) {
    throw new Error(`Repository: Error in find and increment - ${error.message}`);
  }
}

module.exports = {
  findSequence,
  createSequence,
  incrementSequence,
  findAndIncrement
};
