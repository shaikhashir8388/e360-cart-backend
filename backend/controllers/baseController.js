/**
 * Base Controller Class
 * Contains common methods for all controllers
 */
class BaseController {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Success message
   * @param {Object} data - Response data
   */
  static sendSuccess(res, statusCode = 200, message = 'Success', data = null) {
    const response = {
      success: true,
      message
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Error message
   * @param {Array} errors - Validation errors array
   */
  static sendError(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors !== null) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors from express-validator
   */
  static sendValidationError(res, errors) {
    return this.sendError(res, 400, 'Validation failed', errors);
  }

  /**
   * Handle async errors
   * @param {Function} fn - Async function to wrap
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle mongoose validation errors
   * @param {Object} error - Mongoose error object
   */
  static handleMongooseError(error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return {
        statusCode: 400,
        message: 'Validation failed',
        errors
      };
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return {
        statusCode: 400,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`
      };
    }

    if (error.name === 'CastError') {
      return {
        statusCode: 404,
        message: 'Resource not found'
      };
    }

    return {
      statusCode: 500,
      message: 'Internal server error'
    };
  }

  /**
   * Extract pagination parameters from query
   * @param {Object} query - Request query object
   * @param {Number} defaultLimit - Default limit per page
   */
  static getPagination(query, defaultLimit = 10) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip
    };
  }

  /**
   * Create pagination response
   * @param {Array} data - Data array
   * @param {Number} total - Total count
   * @param {Number} page - Current page
   * @param {Number} limit - Limit per page
   */
  static createPaginationResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext,
        hasPrev
      }
    };
  }
}

module.exports = BaseController;
