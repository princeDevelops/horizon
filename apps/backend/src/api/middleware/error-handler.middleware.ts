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

/** Normalizes unknown errors and sends a structured API error response. */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (
    (err.name === 'MongoError' || err.name === 'MongoServerError') &&
    'code' in err &&
    (err as any).code === 11000
  ) {
    const field = Object.keys((err as any).keyPattern)[0];
    error = new ConflictError(`${field} already exists`, 'DUPLICATE_FIELD');
  } else if (err.name === 'ValidationError') {
    error = new ValidationError(
      'Validation failed',
      undefined,
      'VALIDATION_FAILED'
    );
  } else if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError(
      'Invalid or malformed token',
      'INVALID_TOKEN'
    );
  } else if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError(
      'Your session has expired, please login again',
      'TOKEN_EXPIRED'
    );
  } else if (err.name === 'CastError') {
    error = new ValidationError(
      `Invalid ${(err as any).kind} format`,
      (err as any).path,
      'INVALID_FORMAT'
    );
  } else if (err instanceof TypeError) {
    error = new ProgrammingError(err.message);
  } else if (err instanceof ReferenceError) {
    error = new ProgrammingError(err.message);
  } else {
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

  if (!error.path) {
    error.path = req.path;
  }

  if (error instanceof ProgrammingError || !error.isOperational) {
    console.error('PROGRAMMING ERROR:', {
      name: error.name,
      message: error.message,
      path: error.path,
      statusCode: error.statusCode,
      stack: error.stack,
    });
  } else {
    console.warn('OPERATIONAL ERROR:', {
      name: error.name,
      message: error.message,
      path: error.path,
      statusCode: error.statusCode,
    });
  }

  const statusCode = error.statusCode || 500;

  const response: any = {
    status: statusCode < 500 ? 'fail' : 'error',
    statusCode,
    message: error.message,
    timestamp: error.timestamp,
  };

  if (error instanceof ValidationError) {
    if (error.field) {
      response.field = error.field;
    }
    if (error.code) {
      response.code = error.code;
    }
  }

  if (error instanceof NotFoundError) {
    if (error.resourceType) {
      response.resourceType = error.resourceType;
    }
    if (error.resourceId) {
      response.resourceId = error.resourceId;
    }
  }

  if (error instanceof ForbiddenError) {
    if (error.requiredRole) {
      response.requiredRole = error.requiredRole;
    }
  }

  if (error instanceof ConflictError) {
    if (error.code) {
      response.code = error.code;
    }
  }

  if (error instanceof UnauthorizedError) {
    if (error.code) {
      response.code = error.code;
    }
  }

  if (error instanceof InternalServerError) {
    if (error.errorId) {
      response.errorId = error.errorId;
    }
  }

  if (error instanceof ServiceUnavailableError) {
    if (error.service) {
      response.service = error.service;
    }
    if (error.retryAfter) {
      response.retryAfter = error.retryAfter;
      res.set('Retry-After', String(error.retryAfter));
    }
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
