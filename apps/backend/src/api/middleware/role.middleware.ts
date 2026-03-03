import type { NextFunction, Request, Response } from 'express';
import { ErrorFactory } from '../errors/errors';
import { type UserRole } from '@horizon/shared';

/** Authorizes requests when the authenticated user's role is in `allowedRoles`. */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ErrorFactory.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ErrorFactory.forbidden('Insufficient permissions'));
    }

    return next();
  };
};
