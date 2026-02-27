import { ErrorFactory } from '../../api/errors/errors';
import { isNonEmptyString } from './common.validation';

export const validateEmailOrThrow = (email: unknown): string => {
  if (!isNonEmptyString(email)) {
    throw ErrorFactory.validation('Email is required', 'email', 'ERR_EMAIL_REQUIRED');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw ErrorFactory.validation(
      'Email format is invalid',
      'email',
      'ERR_EMAIL_INVALID'
    );
  }

  return normalizedEmail;
};

export const validatePasswordOrThrow = (password: unknown): string => {
  if (!isNonEmptyString(password)) {
    throw ErrorFactory.validation(
      'Password is required',
      'password',
      'ERR_PASSWORD_REQUIRED'
    );
  }

  const normalizedPassword = password.trim();
  if (normalizedPassword.length < 8) {
    throw ErrorFactory.validation(
      'Password must be at least 8 characters',
      'password',
      'ERR_PASSWORD_TOO_SHORT'
    );
  }

  return normalizedPassword;
};

export const validateNameOrThrow = (name: unknown): string => {
  if (!isNonEmptyString(name)) {
    throw ErrorFactory.validation('Name is required', 'name', 'ERR_NAME_REQUIRED');
  }

  return name.trim();
};

export const validateRefreshTokenOrThrow = (token: unknown): string => {
  if (!isNonEmptyString(token)) {
    throw ErrorFactory.unauthorized(
      'Refresh token is required',
      'ERR_REFRESH_TOKEN_REQUIRED'
    );
  }

  return token.trim();
};

export const validateOAuthCodeOrThrow = (code: unknown): string => {
  if (!isNonEmptyString(code)) {
    throw ErrorFactory.badRequest(
      'Authorization code is required',
      'ERR_OAUTH_CODE_REQUIRED'
    );
  }

  return code.trim();
};

export const validateOAuthStateOrThrow = (state: unknown): string => {
  if (!isNonEmptyString(state)) {
    throw ErrorFactory.unauthorized('Invalid OAuth state', 'ERR_INVALID_OAUTH_STATE');
  }

  return state.trim();
};

