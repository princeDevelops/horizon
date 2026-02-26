export const JWT_PAYLOAD_KEYS = {
  USER_ID: 'userId',
  EMAIL: 'email',
  ROLE: 'role',
  PROVIDER: 'provider',
} as const;

export type JwtPayload = {
  [JWT_PAYLOAD_KEYS.USER_ID]: string;
  [JWT_PAYLOAD_KEYS.EMAIL]: string;
  [JWT_PAYLOAD_KEYS.ROLE]: string;
  [JWT_PAYLOAD_KEYS.PROVIDER]: string;
};
