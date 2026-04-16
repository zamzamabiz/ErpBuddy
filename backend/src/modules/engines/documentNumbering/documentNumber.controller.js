const service = require('./documentNumber.service');
const { validateGenerateRequest } = require('./documentNumber.validation');

/**
 * Generate document number
 * POST /api/document-number/generate
 * 
 * Request body:
 * {
 *   module: "sales" | "purchase" | "journal" | "payment" | "receipt" | "inventory" | "payroll"
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   documentNumber: "INV-2026-00001",
 *   sequence: { ... }
 * }
 */
async function generateDocumentNumber(req, res, next) {
  try {
    // 1. Validate request
    const { error, value } = validateGenerateRequest(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 2. Get tenantId from authenticated user
    const tenantId = req.user.tenant || req.user.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant information not found in user session'
      });
    }

    // 3. Generate document number
    const result = await service.generateDocumentNumber(value.module, tenantId);

    // 4. Return success response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get supported modules and their prefixes
 * GET /api/document-number/modules
 * 
 * Response:
 * {
 *   success: true,
 *   modules: { sales: "INV", purchase: "PO", ... }
 * }
 */
async function getModules(req, res, next) {
  try {
    const modules = service.getModulePrefixMap();
    res.status(200).json({
      success: true,
      data: modules
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateDocumentNumber,
  getModules
};
