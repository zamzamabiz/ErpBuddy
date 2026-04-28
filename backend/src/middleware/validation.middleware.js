const mongoose = require('mongoose');

/**
 * VALIDATION MIDDLEWARE
 * Provides reusable validation functions for API requests
 */

/**
 * Validate required fields in request body
 */
function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Validate numeric fields are positive
 */
function validatePositiveNumbers(fields) {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const field of fields) {
      if (req.body[field] !== undefined && (typeof req.body[field] !== 'number' || req.body[field] <= 0)) {
        invalidFields.push(field);
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Fields must be positive numbers: ${invalidFields.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Validate MongoDB ObjectId format
 */
function validateObjectId(fields) {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const field of fields) {
      if (req.body[field] !== undefined && !mongoose.Types.ObjectId.isValid(req.body[field])) {
        invalidFields.push(field);
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid ObjectId format: ${invalidFields.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Validate date format
 */
function validateDate(fields) {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const date = new Date(req.body[field]);
        if (isNaN(date.getTime())) {
          invalidFields.push(field);
        }
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid date format: ${invalidFields.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Validate array has at least one item
 */
function validateArrayNotEmpty(field) {
  return (req, res, next) => {
    if (req.body[field] === undefined || !Array.isArray(req.body[field]) || req.body[field].length === 0) {
      return res.status(400).json({
        success: false,
        error: `${field} must be a non-empty array`
      });
    }
    
    next();
  };
}

/**
 * Sanitize input - remove negative values
 */
function sanitizePositiveNumbers(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] !== undefined && typeof req.body[field] === 'number' && req.body[field] < 0) {
        req.body[field] = 0;
      }
    }
    
    next();
  };
}

/**
 * Ensure tenantId is present in request
 */
function ensureTenantId(req, res, next) {
  if (!req.tenantId && !req.body.tenantId && !req.query.tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant ID is required'
    });
  }
  
  next();
}

module.exports = {
  validateRequiredFields,
  validatePositiveNumbers,
  validateObjectId,
  validateDate,
  validateArrayNotEmpty,
  sanitizePositiveNumbers,
  ensureTenantId
};