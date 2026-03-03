import type { NextFunction, Request, Response } from 'express';
import type { AccessTokenPayload } from '@horizon/shared';
import { ErrorFactory } from '../errors/errors';
import { verifyAccessToken } from '../config/jwt';
import { logger } from '../../utils/logger';

export type AuthUser = AccessTokenPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifies bearer access token and attaches trusted user claims to the request. */
export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Auth middleware rejected request: missing/invalid bearer header', {
      path: req.path,
      method: req.method,
    });
    return next(
      ErrorFactory.unauthorized('Missing or invalid Authorization header')
    );
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
    logger.info('Auth middleware accepted request', {
      userId: payload.userId,
      path: req.path,
      method: req.method,
    });
    return next();
  } catch (error) {
    logger.warn('Auth middleware rejected request: invalid/expired access token', {
      path: req.path,
      method: req.method,
    });
    return next(ErrorFactory.unauthorized('Invalid or expired access token'));
  }
};
