export const AUTH_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
