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

const getAuthenticatedUserOrThrow = (req: Request) => {
  if (!req.user) {
    throw ErrorFactory.unauthorized('Authentication required');
  }
  return req.user;
};

const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  // Refresh token stays in httpOnly cookie so JS in browser can't read it.
  res.cookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: AUTH_CONSTANTS.REFRESH_COOKIE_PATH,
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: AUTH_CONSTANTS.REFRESH_COOKIE_PATH,
  });
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<SignUpInput>;
  const input: SignUpInput = {
    email: validateEmailOrThrow(body.email),
    password: validatePasswordOrThrow(body.password),
    name: validateNameOrThrow(body.name),
  };

  const result = await authService.signup(input, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

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

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<LoginInput>;
  const input: LoginInput = {
    email: validateEmailOrThrow(body.email),
    password: validatePasswordOrThrow(body.password),
  };

  const result = await authService.login(input, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

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

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RefreshTokenInput;
  const cookieToken = req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME] as
    | string
    | undefined;
  const refreshToken = validateRefreshTokenOrThrow(cookieToken ?? input.refreshToken);

  const result = await authService.refresh(refreshToken, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

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

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME] as
    | string
    | undefined;

  // Logout should still succeed even if token is missing/invalid.
  if (cookieToken) {
    await authService.logout(cookieToken);
  }

  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const authUser = getAuthenticatedUserOrThrow(req);
  const user = await authService.me(authUser.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const oauthStart = asyncHandler(async (req: Request, res: Response) => {
  const rawProvider = req.params.provider;
  const provider = Array.isArray(rawProvider)
    ? rawProvider[0]?.toUpperCase()
    : rawProvider?.toUpperCase();

  if (provider !== AUTH_PROVIDERS.GOOGLE && provider !== AUTH_PROVIDERS.GITHUB) {
    throw ErrorFactory.badRequest('Unsupported OAuth provider', 'ERR_UNSUPPORTED_PROVIDER');
  }

  const { url, state } = oauthService.buildAuthorizationUrl(provider);

  // Save OAuth state in cookie to protect against CSRF in callback.
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  res.redirect(url);
});

export const oauthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const rawProvider = req.params.provider;
    const provider = Array.isArray(rawProvider)
      ? rawProvider[0]?.toUpperCase()
      : rawProvider?.toUpperCase();

    if (provider !== AUTH_PROVIDERS.GOOGLE && provider !== AUTH_PROVIDERS.GITHUB) {
      throw ErrorFactory.badRequest('Unsupported OAuth provider', 'ERR_UNSUPPORTED_PROVIDER');
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
      throw ErrorFactory.unauthorized('Invalid OAuth state', 'ERR_INVALID_OAUTH_STATE');
    }

    const result = await oauthService.handleCallback(input.provider, input.code, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

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
