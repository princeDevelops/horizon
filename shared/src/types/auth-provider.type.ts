/** OAuth providers currently supported by the platform. */
export const AUTH_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
} as const;

/** Union of supported OAuth provider identifiers. */
export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
