/** Authentication token and cookie configuration values. */
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '7d',
  REFRESH_COOKIE_NAME: 'refreshToken',
  REFRESH_COOKIE_PATH: '/api/v1/auth/refresh',
  BCRYPT_SALT_ROUNDS: 12,
} as const;
