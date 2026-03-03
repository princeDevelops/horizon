/** Supported application roles used for authorization checks. */
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

/** Union of allowed user role string literals. */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
