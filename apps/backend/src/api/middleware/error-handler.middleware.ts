import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
  ProgrammingError,
} from '../errors/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: AppError;

  // ============================================================
  // CONVERT UNKNOWN ERRORS TO AppError
  // ============================================================

  if (err instanceof AppError) {
    error = err;
  } else if (
    (err.name === 'MongoError' || err.name === 'MongoServerError') &&
    'code' in err &&
    (err as any).code === 11000
  ) {
    // MongoDB duplicate key error
    const field = Object.keys((err as any).keyPattern)[0];
    error = new ConflictError(`${field} already exists`, 'DUPLICATE_FIELD');
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    error = new ValidationError(
      'Validation failed',
      undefined,
      'VALIDATION_FAILED'
    );
  } else if (err.name === 'JsonWebTokenError') {
    // JWT verification failed
    error = new UnauthorizedError(
      'Invalid or malformed token',
      'INVALID_TOKEN'
    );
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    error = new UnauthorizedError(
      'Your session has expired, please login again',
      'TOKEN_EXPIRED'
    );
  } else if (err.name === 'CastError') {
    // MongoDB invalid ID format
    error = new ValidationError(
      `Invalid ${(err as any).kind} format`,
      (err as any).path,
      'INVALID_FORMAT'
    );
  } else if (err instanceof TypeError) {
    // Type errors are programming errors
    error = new ProgrammingError(err.message);
  } else if (err instanceof ReferenceError) {
    // Reference errors are programming errors
    error = new ProgrammingError(err.message);
  } else {
    // Unknown error - log and convert
    console.error('Unhandled error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    error = new InternalServerError(
      'An unexpected error occurred',
      `ERR-${Date.now()}`
    );
  }

  // ============================================================
  // ADD REQUEST PATH TO ERROR
  // ============================================================

  if (!error.path) {
    error.path = req.path;
  }

  // ============================================================
  // LOG ERRORS BASED ON TYPE
  // ============================================================

  if (error instanceof ProgrammingError || !error.isOperational) {
    // Programming errors - log with full details for debugging
    console.error('PROGRAMMING ERROR:', {
      name: error.name,
      message: error.message,
      path: error.path,
      statusCode: error.statusCode,
      stack: error.stack,
    });
  } else {
    // Operational errors - log normally
    console.warn('OPERATIONAL ERROR:', {
      name: error.name,
      message: error.message,
      path: error.path,
      statusCode: error.statusCode,
    });
  }

  // ============================================================
  // BUILD RESPONSE
  // ============================================================

  const statusCode = error.statusCode || 500;

  const response: any = {
    status: statusCode < 500 ? 'fail' : 'error',
    statusCode,
    message: error.message,
    timestamp: error.timestamp,
  };

  // ============================================================
  // ADD ERROR-SPECIFIC DETAILS
  // ============================================================

  // Validation error details
  if (error instanceof ValidationError) {
    if (error.field) {
      response.field = error.field;
    }
    if (error.code) {
      response.code = error.code;
    }
  }

  // Not found error details
  if (error instanceof NotFoundError) {
    if (error.resourceType) {
      response.resourceType = error.resourceType;
    }
    if (error.resourceId) {
      response.resourceId = error.resourceId;
    }
  }

  // Forbidden error details
  if (error instanceof ForbiddenError) {
    if (error.requiredRole) {
      response.requiredRole = error.requiredRole;
    }
  }

  // Conflict error details
  if (error instanceof ConflictError) {
    if (error.code) {
      response.code = error.code;
    }
  }

  // Unauthorized error details
  if (error instanceof UnauthorizedError) {
    if (error.code) {
      response.code = error.code;
    }
  }

  // Internal server error details
  if (error instanceof InternalServerError) {
    if (error.errorId) {
      response.errorId = error.errorId;
    }
  }

  // Service unavailable details
  if (error instanceof ServiceUnavailableError) {
    if (error.service) {
      response.service = error.service;
    }
    if (error.retryAfter) {
      response.retryAfter = error.retryAfter;
      res.set('Retry-After', String(error.retryAfter));
    }
  }

  // ============================================================
  // ADD STACK TRACE IN DEVELOPMENT
  // ============================================================

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // ============================================================
  // SEND RESPONSE
  // ============================================================

  res.status(statusCode).json(response);
};
