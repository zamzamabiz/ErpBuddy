const repository = require('./documentSequence.repository');

// Module to prefix mapping
const MODULE_PREFIX_MAP = {
  sales: 'INV',
  purchase: 'PO',
  journal: 'JV',
  payment: 'PAY',
  receipt: 'REC',
  inventory: 'STK',
  payroll: 'SAL'
};

/**
 * Generate next document number for a module
 * Format: PREFIX-YEAR-PADDED_NUMBER
 * Example: INV-2026-00001
 * 
 * CRITICAL LOGIC:
 * 1. Get current year automatically
 * 2. Get prefix for module
 * 3. Find or create sequence
 * 4. Increment atomically (ZERO duplicates)
 * 5. Format and return
 * 
 * @param {string} module - Module name (sales, purchase, etc.)
 * @param {ObjectId} tenantId - Tenant ID (from req.user)
 * @returns {Object} { documentNumber: "INV-2026-00001" }
 */
async function generateDocumentNumber(module, tenantId) {
  try {
    // 1. Validate module
    if (!MODULE_PREFIX_MAP[module]) {
      throw new Error(`Invalid module: ${module}. Valid modules: ${Object.keys(MODULE_PREFIX_MAP).join(', ')}`);
    }

    // 2. Validate tenantId
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // 3. Get current year
    const currentYear = new Date().getFullYear();

    // 4. Get prefix for module
    const prefix = MODULE_PREFIX_MAP[module];

    // 5. Find sequence for this tenant, module, and year
    let sequence = await repository.findSequence(tenantId, module, currentYear);

    // 6. If sequence doesn't exist, create it
    if (!sequence) {
      try {
        sequence = await repository.createSequence({
          tenantId,
          module,
          prefix,
          year: currentYear,
          padding: 5
        });
      } catch (error) {
        // If create fails (likely duplicate), try finding again
        sequence = await repository.findSequence(tenantId, module, currentYear);
        if (!sequence) {
          throw error;
        }
      }
    }

    // 7. INCREMENT ATOMICALLY (Critical for zero duplicates)
    sequence = await repository.incrementSequence(sequence._id);

    // 8. Format document number: PREFIX-YEAR-PADDED_NUMBER
    const paddedNumber = String(sequence.currentNumber).padStart(sequence.padding, '0');
    const documentNumber = `${prefix}-${currentYear}-${paddedNumber}`;

    return {
      documentNumber,
      sequence: {
        id: sequence._id,
        module,
        prefix,
        year: currentYear,
        currentNumber: sequence.currentNumber,
        padding: sequence.padding
      }
    };
  } catch (error) {
    throw new Error(`Service: Error generating document number - ${error.message}`);
  }
}

/**
 * Get module prefix map (for frontend dropdowns)
 * @returns {Object} Module to prefix mapping
 */
function getModulePrefixMap() {
  return MODULE_PREFIX_MAP;
}

/**
 * Get supported modules
 * @returns {Array} List of supported modules
 */
function getSupportedModules() {
  return Object.keys(MODULE_PREFIX_MAP);
}

module.exports = {
  generateDocumentNumber,
  getModulePrefixMap,
  getSupportedModules,
  MODULE_PREFIX_MAP
};
