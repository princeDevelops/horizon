/** Reads a required OAuth environment variable and throws if missing. */
const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var : ${key}`);
  return value;
};

export const OAUTH_CONFIG = {
  GOOGLE: {
    CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
    CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET'),
    CALLBACK_URL: getEnv('GOOGLE_CALLBACK_URL'),
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    USERINFO_URL: 'https://www.googleapis.com/oauth2/v2/userinfo',
    AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  GITHUB: {
    CLIENT_ID: getEnv('GITHUB_CLIENT_ID'),
    CLIENT_SECRET: getEnv('GITHUB_CLIENT_SECRET'),
    CALLBACK_URL: getEnv('GITHUB_CALLBACK_URL'),
    TOKEN_URL: 'https://github.com/login/oauth/access_token',
    USERINFO_URL: 'https://api.github.com/user',
    AUTH_URL: 'https://github.com/login/oauth/authorize',
  },
} as const;
