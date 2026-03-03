/** Base application error with HTTP semantics. */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public timestamp: Date;
  public path?: string;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Returns a serializable error payload. */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      path: this.path,
    };
  }
}

/** 400 validation error. */
export class ValidationError extends AppError {
  public field?: string;
  public code: string;

  constructor(message: string, field?: string, code = 'VALIDATION_ERROR') {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/** 400 bad request error. */
export class BadRequestError extends AppError {
  public code: string;

  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, true);
    this.name = 'BadRequestError';
    this.code = code;

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/** 401 unauthorized error. */
export class UnauthorizedError extends AppError {
  public code: string;

  constructor(message: string = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, true);
    this.name = 'UnauthorizedError';
    this.code = code;

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/** 403 forbidden error. */
export class ForbiddenError extends AppError {
  public requiredRole?: string;

  constructor(
    message: string = 'You do not have permission to access this resource',
    requiredRole?: string
  ) {
    super(message, 403, true);
    this.name = 'ForbiddenError';
    this.requiredRole = requiredRole;

    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/** 404 not found error. */
export class NotFoundError extends AppError {
  public resourceType?: string;
  public resourceId?: string;

  constructor(
    message: string = 'Resource not found',
    resourceType?: string,
    resourceId?: string
  ) {
    super(message, 404, true);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/** 409 conflict error. */
export class ConflictError extends AppError {
  public code: string;

  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, true);
    this.name = 'ConflictError';
    this.code = code;

    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/** 422 unprocessable entity error. */
export class UnprocessableEntityError extends AppError {
  public code: string;

  constructor(message: string, code = 'UNPROCESSABLE_ENTITY') {
    super(message, 422, true);
    this.name = 'UnprocessableEntityError';
    this.code = code;

    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/** 429 too many requests error. */
export class TooManyRequestsError extends AppError {
  public retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429, true);
    this.name = 'TooManyRequestsError';
    this.retryAfter = retryAfter;

    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

/** 500 internal server error. */
export class InternalServerError extends AppError {
  public errorId?: string;

  constructor(
    message = 'Internal server error',
    errorId = `ERR-${Date.now()}`
  ) {
    super(message, 500, true);
    this.name = 'InternalServerError';
    this.errorId = errorId;

    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/** 503 service unavailable error. */
export class ServiceUnavailableError extends AppError {
  public service?: string;
  public retryAfter?: number;

  constructor(
    message = 'Service temporarily unavailable',
    service?: string,
    retryAfter?: number
  ) {
    super(message, 503, true);
    this.name = 'ServiceUnavailableError';
    this.service = service;
    this.retryAfter = retryAfter;

    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/** Non-operational programming error used for unexpected code defects. */
export class ProgrammingError extends AppError {
  constructor(message: string) {
    super(message, 500, false);
    this.name = 'ProgrammingError';

    Object.setPrototypeOf(this, ProgrammingError.prototype);
  }
}

/** Factory helpers for consistent error construction across layers. */
export class ErrorFactory {
  /** Creates a validation error. */
  static validation(message: string, field?: string, code?: string) {
    return new ValidationError(message, field, code);
  }

  /** Creates a bad request error. */
  static badRequest(message: string, code?: string) {
    return new BadRequestError(message, code);
  }

  /** Creates an unauthorized error. */
  static unauthorized(message?: string, code?: string) {
    return new UnauthorizedError(message, code);
  }

  /** Creates a forbidden error. */
  static forbidden(message?: string, requiredRole?: string) {
    return new ForbiddenError(message, requiredRole);
  }

  /** Creates a not-found error for a named resource. */
  static notFound(resourceType: string, resourceId?: string) {
    const message = resourceId
      ? `${resourceType} with id '${resourceId}' not found`
      : `${resourceType} not found`;
    return new NotFoundError(message, resourceType, resourceId);
  }

  /** Creates a conflict error. */
  static conflict(message: string, code?: string) {
    return new ConflictError(message, code);
  }

  /** Creates an unprocessable-entity error. */
  static unprocessable(message: string, code?: string) {
    return new UnprocessableEntityError(message, code);
  }

  /** Creates a rate-limit error. */
  static tooManyRequests(retryAfter?: number) {
    return new TooManyRequestsError('Too many requests, please try again later', retryAfter);
  }

  /** Creates an internal server error. */
  static internalServer(message?: string, errorId?: string) {
    return new InternalServerError(message, errorId);
  }

  /** Creates a service-unavailable error. */
  static serviceUnavailable(service?: string, retryAfter?: number) {
    return new ServiceUnavailableError(
      `${service || 'Service'} is temporarily unavailable`,
      service,
      retryAfter
    );
  }

  /** Creates a programming error. */
  static programming(message: string) {
    return new ProgrammingError(message);
  }
}
