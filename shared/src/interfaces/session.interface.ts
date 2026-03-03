/** Persisted refresh session contract. */
export interface Session {
  userId: string;
  refreshTokenHash: string;
  expiresAt: string;
  revokedAt?: string;
  userAgent?: string;
  ipAddress?: string;

  createdAt: string;
  updatedAt: string;
}
