import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

import {
  AUTH_CONSTANTS,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from '@horizon/shared';

/** Reads a required environment variable and throws if missing. */
const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var : ${key}`);

  return value;
};

const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET');
const REFRESH_TOKEN_SECRET = getEnv('REFRESH_TOKEN_SECRET');

/** Signs a short-lived access token. */
export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(
    payload,
    ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_TTL,
    } as SignOptions
  );

/** Verifies and decodes an access token. */
export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;

/** Signs a refresh token with session claims. */
export const signRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(
    payload,
    REFRESH_TOKEN_SECRET as Secret,
    { expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_TTL } as SignOptions
  );

/** Verifies and decodes a refresh token. */
export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
