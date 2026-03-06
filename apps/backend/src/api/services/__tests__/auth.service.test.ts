import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bcrypt: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  jwt: {
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  },
  userModel: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
  sessionModel: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
    create: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: mocks.bcrypt.hash,
    compare: mocks.bcrypt.compare,
  },
}));

vi.mock('../../config/jwt', () => ({
  signAccessToken: mocks.jwt.signAccessToken,
  signRefreshToken: mocks.jwt.signRefreshToken,
  verifyRefreshToken: mocks.jwt.verifyRefreshToken,
}));

vi.mock('../../models/user.model', () => ({
  UserModel: mocks.userModel,
}));

vi.mock('../../models/session.model', () => ({
  SessionModel: mocks.sessionModel,
}));

vi.mock('../../../utils/logger', () => ({
  logger: mocks.logger,
}));

import { authService } from '../auth.service';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signup rejects duplicate email', async () => {
    mocks.userModel.findOne.mockResolvedValue({ _id: { toString: () => 'u1' } });

    await expect(
      authService.signup({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Duplicate User',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'ERR_EMAIL_EXISTS',
    });

    expect(mocks.userModel.create).not.toHaveBeenCalled();
    expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
  });

  it('login rejects invalid password', async () => {
    const query = {
      select: vi.fn().mockResolvedValue({
        _id: { toString: () => 'u1' },
        email: 'user@example.com',
        role: 'USER',
        tokenVersion: 0,
        passwordHash: 'hashed-password',
      }),
    };
    mocks.userModel.findOne.mockReturnValue(query);
    mocks.bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({
        email: 'user@example.com',
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'ERR_INVALID_CREDENTIALS',
    });

    expect(query.select).toHaveBeenCalledWith('+passwordHash');
  });

  it('refresh rejects when active session is missing', async () => {
    mocks.jwt.verifyRefreshToken.mockReturnValue({
      userId: 'u1',
      sessionId: 's1',
      tokenVersion: 0,
    });
    mocks.sessionModel.findOne.mockResolvedValue(null);

    await expect(authService.refresh('refresh-token')).rejects.toMatchObject({
      statusCode: 401,
      code: 'ERR_INVALID_REFRESH_TOKEN',
    });

    expect(mocks.userModel.findById).not.toHaveBeenCalled();
    expect(mocks.sessionModel.updateOne).not.toHaveBeenCalled();
  });
});
