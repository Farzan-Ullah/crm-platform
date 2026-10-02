import { logger } from '../config/logger.js';
import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let errors = err.errors || [];

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. It must be unique.`;
    errors = [{ field, message }];
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    message = 'Validation failed for one or more fields';
  }

  // CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'BAD_REQUEST';
    message = `Invalid format for parameter: ${err.path}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Authentication token is invalid';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[500 ERROR] ${req.method} ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`[${statusCode} CLIENT ERROR] ${req.method} ${req.originalUrl} - ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
    ...(ENV.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
};
