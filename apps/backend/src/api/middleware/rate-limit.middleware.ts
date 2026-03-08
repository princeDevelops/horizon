import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import { ErrorFactory } from '../errors/errors';

type LimiterOptions = {
  windowMs: number;
  max: number;
  scope: string;
};

const getNumberFromEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildLimiter = ({ windowMs, max, scope }: LimiterOptions) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? 'unknown'),
    handler: (req: Request, _res: Response, next: NextFunction) => {
      const rateLimitInfo = req as Request & {
        rateLimit?: { resetTime?: Date };
      };

      const retryAfterSec = rateLimitInfo.rateLimit?.resetTime
        ? Math.max(
            1,
            Math.ceil(
              (rateLimitInfo.rateLimit.resetTime.getTime() - Date.now()) / 1000
            )
          )
        : undefined;

      const error = ErrorFactory.tooManyRequests(retryAfterSec);
      error.message = `Too many requests for ${scope}. Please try again later.`;
      return next(error);
    },
  });

const RATE_LIMIT_GLOBAL_WINDOW_MS = getNumberFromEnv(
  'RATE_LIMIT_GLOBAL_WINDOW_MS',
  15 * 60 * 1000
);
const RATE_LIMIT_GLOBAL_MAX = getNumberFromEnv('RATE_LIMIT_GLOBAL_MAX', 120);

const RATE_LIMIT_AUTH_WINDOW_MS = getNumberFromEnv(
  'RATE_LIMIT_AUTH_WINDOW_MS',
  15 * 60 * 1000
);
const RATE_LIMIT_AUTH_MAX = getNumberFromEnv('RATE_LIMIT_AUTH_MAX', 10);

export const globalApiLimiter = buildLimiter({
  windowMs: RATE_LIMIT_GLOBAL_WINDOW_MS,
  max: RATE_LIMIT_GLOBAL_MAX,
  scope: 'api',
});

export const authStrictLimiter = buildLimiter({
  windowMs: RATE_LIMIT_AUTH_WINDOW_MS,
  max: RATE_LIMIT_AUTH_MAX,
  scope: 'auth',
});
