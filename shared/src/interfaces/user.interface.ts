import { UserRole, AuthProvider } from '../types';

/** Canonical user shape shared across backend and client. */
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  providers: {
    provider: AuthProvider;
    providerUserId: string;
  }[];

  isEmailVerified: boolean;
  tokenVersion: number;

  /** ISO timestamp when the user was created. */
  createdAt: string;
  /** ISO timestamp of the last user update. */
  updatedAt: string;
}
