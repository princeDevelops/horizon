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

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

const hashRefreshToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

// Keep response user object clean and avoid leaking passwordHash.
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

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const authService = {
  async signup(input: SignUpInput, meta?: RequestMeta) {
    const email = normalizeEmail(input.email);

    if (!input.password || input.password.length < 8) {
      throw ErrorFactory.validation(
        'Password must be at least 8 characters',
        'password',
        'ERR_PASSWORD_TOO_SHORT'
      );
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
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

    return this.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role as UserRole,
      user.tokenVersion,
      user
    );
  },

  async login(input: LoginInput, meta?: RequestMeta) {
    const email = normalizeEmail(input.email);

    // passwordHash is select:false in schema, so explicit select is required.
    const user = await UserModel.findOne({ email }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      throw ErrorFactory.unauthorized(
        'Invalid email or password',
        'ERR_INVALID_CREDENTIALS'
      );
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw ErrorFactory.unauthorized(
        'Invalid email or password',
        'ERR_INVALID_CREDENTIALS'
      );
    }

    return this.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role as UserRole,
      user.tokenVersion,
      user
    );
  },

  async refresh(refreshToken: string, meta?: RequestMeta) {
    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const activeSession = await SessionModel.findOne({
      _id: payload.sessionId,
      userId: payload.userId,
      refreshTokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!activeSession) {
      throw ErrorFactory.unauthorized(
        'Invalid refresh token',
        'ERR_INVALID_REFRESH_TOKEN'
      );
    }

    const user = await UserModel.findById(payload.userId);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw ErrorFactory.unauthorized('Session is no longer valid', 'ERR_SESSION_INVALID');
    }

    // Revoke old refresh token session before issuing new one.
    await SessionModel.updateOne(
      { _id: activeSession._id },
      { $set: { revokedAt: new Date() } }
    );

    return this.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role as UserRole,
      user.tokenVersion,
      user
    );
  },

  async logout(refreshToken: string) {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await SessionModel.updateOne(
      { refreshTokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  },

  async me(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw ErrorFactory.notFound('User', userId);
    return toPublicUser(user);
  },

  async issueSessionTokens(
    userId: string,
    meta: RequestMeta | undefined,
    email: string,
    role: UserRole,
    tokenVersion: number,
    userDoc: any
  ) {
    // Create a temporary record first to get sessionId for refresh token claims.
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

    const accessToken = signAccessToken({
      userId,
      email,
      role,
      tokenVersion,
    });

    return {
      user: toPublicUser(userDoc),
      accessToken,
      refreshToken,
    };
  },
};

