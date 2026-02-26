import { UserRole, AuthProvider } from '../types';
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

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
