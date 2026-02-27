import type { NextFunction, Request, Response } from 'express';
import type { AccessTokenPayload } from '@horizon/shared';
import { ErrorFactory } from '../errors/errors';
import { verifyAccessToken } from '../config/jwt';

export type AuthUser = AccessTokenPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    return next();
  } catch (error) {
    return next(ErrorFactory.unauthorized('Invalid or expired access token'));
  }
};
