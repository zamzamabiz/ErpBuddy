// Standard API Response Utility - Supports both function and static method styles

// Function-style: apiResponse({ success: true, message: 'msg', data: {...} })
function apiResponse({ success = true, message = '', data = null, errors = null } = {}) {
  return {
    success,
    message,
    ...(data !== null && { data }),
    ...(errors && { errors })
  };
}

// Static methods: ApiResponse.success('msg', data) / ApiResponse.error('msg', errors)
apiResponse.success = function(message = '', data = null, meta = null) {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta })
  };
};

apiResponse.error = function(message = '', errors = null) {
  return {
    success: false,
    message,
    errors: errors || []
  };
};

module.exports = apiResponse;
