import type { UserRole } from './user-role.type';

/** Claims embedded in short-lived access tokens. */
export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
};

/** Claims embedded in refresh tokens for session rotation. */
export type RefreshTokenPayload = {
  userId: string;
  sessionId: string;
  tokenVersion: number;
};
