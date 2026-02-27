import type { UserRole } from './user-role.type';

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
};

export type RefreshTokenPayload = {
  userId: string;
  sessionId: string;
  tokenVersion: number;
};
