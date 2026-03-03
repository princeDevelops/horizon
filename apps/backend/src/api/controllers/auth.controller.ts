import {
  AUTH_CONSTANTS,
  AUTH_PROVIDERS,
  type LoginInput,
  type OAuthCallBackInput,
  type RefreshTokenInput,
  type SignUpInput,
} from '@horizon/shared';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  validateEmailOrThrow,
  validateNameOrThrow,
  validateOAuthCodeOrThrow,
  validateOAuthStateOrThrow,
  validatePasswordOrThrow,
  validateRefreshTokenOrThrow,
} from '../../utils/validation';
import { ErrorFactory } from '../errors/errors';
import { authService } from '../services/auth.service';
import { oauthService } from '../services/oauth.service';
import { logger } from '../../utils/logger';

/** Masks local part of email before writing to logs. */
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'invalid-email';
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
};

/** Returns authenticated user claims or throws `401`. */
const getAuthenticatedUserOrThrow = (req: Request) => {
  if (!req.user) {
    throw ErrorFactory.unauthorized('Authentication required');
  }
  return req.user;
};

/** Stores refresh token in a secure HTTP-only cookie. */
const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: AUTH_CONSTANTS.REFRESH_COOKIE_PATH,
  });
};

/** Clears refresh token cookie on logout and token rotation. */
const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: AUTH_CONSTANTS.REFRESH_COOKIE_PATH,
  });
};

/** Handles user signup and returns access token + user profile. */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<SignUpInput>;
  const input: SignUpInput = {
    email: validateEmailOrThrow(body.email),
    password: validatePasswordOrThrow(body.password),
    name: validateNameOrThrow(body.name),
  };
  logger.info('Signup request validated', {
    email: maskEmail(input.email),
    ipAddress: req.ip,
  });

  const result = await authService.signup(input, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  logger.info('Signup successful', { userId: result.user.id });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(201).json({
    success: true,
    message: 'Signup successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/** Handles credential login and returns access token + user profile. */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<LoginInput>;
  const input: LoginInput = {
    email: validateEmailOrThrow(body.email),
    password: validatePasswordOrThrow(body.password),
  };
  logger.info('Login request validated', {
    email: maskEmail(input.email),
    ipAddress: req.ip,
  });

  const result = await authService.login(input, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  logger.info('Login successful', { userId: result.user.id });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/** Rotates refresh token and issues a new access token. */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RefreshTokenInput;
  const cookieToken = req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME] as
    | string
    | undefined;
  const refreshToken = validateRefreshTokenOrThrow(
    cookieToken ?? input.refreshToken
  );
  logger.info('Refresh token request accepted', {
    source: cookieToken ? 'cookie' : 'body',
    ipAddress: req.ip,
  });

  const result = await authService.refresh(refreshToken, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  logger.info('Access token refreshed', { userId: result.user.id });

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/** Revokes refresh session when cookie token is present. */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME] as
    | string
    | undefined;
  logger.info('Logout requested', {
    hasRefreshCookie: Boolean(cookieToken),
    ipAddress: req.ip,
  });

  if (cookieToken) {
    await authService.logout(cookieToken);
  }

  clearRefreshTokenCookie(res);
  logger.info('Logout completed');

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/** Returns the current authenticated user profile. */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const authUser = getAuthenticatedUserOrThrow(req);
  logger.info('Profile requested by authenticated user', { userId: authUser.userId });
  const user = await authService.me(authUser.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/** Starts OAuth flow for supported providers and stores CSRF state cookie. */
export const oauthStart = asyncHandler(async (req: Request, res: Response) => {
  const rawProvider = req.params.provider;
  const provider = Array.isArray(rawProvider)
    ? rawProvider[0]?.toUpperCase()
    : rawProvider?.toUpperCase();

  if (
    provider !== AUTH_PROVIDERS.GOOGLE &&
    provider !== AUTH_PROVIDERS.GITHUB
  ) {
    logger.warn('OAuth start rejected due to unsupported provider', { provider });
    throw ErrorFactory.badRequest(
      'Unsupported OAuth provider',
      'ERR_UNSUPPORTED_PROVIDER'
    );
  }
  logger.info('OAuth start initiated', { provider });

  const { url, state } = oauthService.buildAuthorizationUrl(provider);

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  res.redirect(url);
});

/** Validates OAuth callback params and issues local session tokens. */
export const oauthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const rawProvider = req.params.provider;
    const provider = Array.isArray(rawProvider)
      ? rawProvider[0]?.toUpperCase()
      : rawProvider?.toUpperCase();

    if (
      provider !== AUTH_PROVIDERS.GOOGLE &&
      provider !== AUTH_PROVIDERS.GITHUB
    ) {
      logger.warn('OAuth callback rejected due to unsupported provider', { provider });
      throw ErrorFactory.badRequest(
        'Unsupported OAuth provider',
        'ERR_UNSUPPORTED_PROVIDER'
      );
    }

    const input: OAuthCallBackInput = {
      provider,
      code: validateOAuthCodeOrThrow(req.query.code),
      state: req.query.state ? String(req.query.state) : undefined,
    };

    const cookieState = req.cookies?.oauth_state as string | undefined;
    const requestState = validateOAuthStateOrThrow(input.state);
    const storedState = validateOAuthStateOrThrow(cookieState);

    if (requestState !== storedState) {
      logger.warn('OAuth callback state mismatch', { provider });
      throw ErrorFactory.unauthorized(
        'Invalid OAuth state',
        'ERR_INVALID_OAUTH_STATE'
      );
    }

    const result = await oauthService.handleCallback(
      input.provider,
      input.code,
      {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      }
    );
    logger.info('OAuth callback succeeded', { provider, userId: result.user.id });

    res.clearCookie('oauth_state');
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      message: 'OAuth login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }
);
