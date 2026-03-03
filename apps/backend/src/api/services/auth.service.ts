import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  AUTH_CONSTANTS,
  USER_ROLES,
  type LoginInput,
  type SignUpInput,
  type UserRole,
} from '@horizon/shared';
import { ErrorFactory } from '../errors/errors';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt';
import { SessionModel } from '../models/session.model';
import { UserModel } from '../models/user.model';
import { logger } from '../../utils/logger';

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

/** Hashes refresh tokens before persisting them in storage. */
const hashRefreshToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/** Builds the public-safe user payload returned by auth endpoints. */
const toPublicUser = (user: any) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  role: user.role,
  providers: user.providers,
  isEmailVerified: user.isEmailVerified,
  tokenVersion: user.tokenVersion,
  createdAt: user.createdAt?.toISOString(),
  updatedAt: user.updatedAt?.toISOString(),
});

/** Normalizes email for case-insensitive lookup and uniqueness checks. */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
/** Masks email before writing it to logs. */
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'invalid-email';
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
};

export const authService = {
  /** Registers a user and issues initial session tokens. */
  async signup(input: SignUpInput, meta?: RequestMeta) {
    const email = normalizeEmail(input.email);
    logger.info('Auth service signup started', { email: maskEmail(email) });

    if (!input.password || input.password.length < 8) {
      throw ErrorFactory.validation(
        'Password must be at least 8 characters',
        'password',
        'ERR_PASSWORD_TOO_SHORT'
      );
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      logger.warn('Signup blocked: email already exists', { email: maskEmail(email) });
      throw ErrorFactory.conflict('Email is already registered', 'ERR_EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
    );

    const user = await UserModel.create({
      email,
      passwordHash,
      name: input.name.trim(),
      role: USER_ROLES.USER,
      providers: [],
      isEmailVerified: false,
      tokenVersion: 0,
    });
    logger.info('User created during signup', { userId: user._id.toString() });

    return this.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role as UserRole,
      user.tokenVersion,
      user
    );
  },

  /** Authenticates user credentials and issues session tokens. */
  async login(input: LoginInput, meta?: RequestMeta) {
    const email = normalizeEmail(input.email);
    logger.info('Auth service login started', { email: maskEmail(email) });

    const user = await UserModel.findOne({ email }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      logger.warn('Login failed: user not found or password hash missing', {
        email: maskEmail(email),
      });
      throw ErrorFactory.unauthorized(
        'Invalid email or password',
        'ERR_INVALID_CREDENTIALS'
      );
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      logger.warn('Login failed: password mismatch', { email: maskEmail(email) });
      throw ErrorFactory.unauthorized(
        'Invalid email or password',
        'ERR_INVALID_CREDENTIALS'
      );
    }
    logger.info('Login credentials verified', { userId: user._id.toString() });

    return this.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role as UserRole,
      user.tokenVersion,
      user
    );
  },

  /** Rotates refresh token by revoking the current session and creating a new one. */
  async refresh(refreshToken: string, meta?: RequestMeta) {
    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRefreshToken(refreshToken);
    logger.info('Refresh token verified', { userId: payload.userId, sessionId: payload.sessionId });

    const activeSession = await SessionModel.findOne({
      _id: payload.sessionId,
      userId: payload.userId,
      refreshTokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!activeSession) {
      logger.warn('Refresh failed: active session not found', {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });
      throw ErrorFactory.unauthorized(
        'Invalid refresh token',
        'ERR_INVALID_REFRESH_TOKEN'
      );
    }

    const user = await UserModel.findById(payload.userId);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      logger.warn('Refresh failed: user missing or token version mismatch', {
        userId: payload.userId,
      });
      throw ErrorFactory.unauthorized('Session is no longer valid', 'ERR_SESSION_INVALID');
    }

    await SessionModel.updateOne(
      { _id: activeSession._id },
      { $set: { revokedAt: new Date() } }
    );
    logger.info('Previous refresh session revoked', { sessionId: activeSession._id.toString() });

    return this.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role as UserRole,
      user.tokenVersion,
      user
    );
  },

  /** Revokes the active refresh session tied to the provided token hash. */
  async logout(refreshToken: string) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    logger.info('Logout token revocation requested');

    await SessionModel.updateOne(
      { refreshTokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    logger.info('Logout token revocation completed');
  },

  /** Returns authenticated user profile data. */
  async me(userId: string) {
    logger.info('Fetching authenticated user profile', { userId });
    const user = await UserModel.findById(userId);
    if (!user) throw ErrorFactory.notFound('User', userId);
    return toPublicUser(user);
  },

  /** Creates persisted session record and signs access/refresh tokens. */
  async issueSessionTokens(
    userId: string,
    meta: RequestMeta | undefined,
    email: string,
    role: UserRole,
    tokenVersion: number,
    userDoc: any
  ) {
    logger.info('Issuing session tokens', { userId });
    const session = await SessionModel.create({
      userId,
      refreshTokenHash: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    const refreshToken = signRefreshToken({
      userId,
      sessionId: session._id.toString(),
      tokenVersion,
    });

    session.refreshTokenHash = hashRefreshToken(refreshToken);
    await session.save();
    logger.info('Refresh session persisted', { sessionId: session._id.toString() });

    const accessToken = signAccessToken({
      userId,
      email,
      role,
      tokenVersion,
    });
    logger.info('Access token issued', { userId });

    return {
      user: toPublicUser(userDoc),
      accessToken,
      refreshToken,
    };
  },
};
