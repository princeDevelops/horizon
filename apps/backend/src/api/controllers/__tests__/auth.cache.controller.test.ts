import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const mocks = vi.hoisted(() => ({
  authService: {
    me: vi.fn(),
  },
  cacheService: {
    getJson: vi.fn(),
    setJson: vi.fn(),
  },
}));

vi.mock('../../services/auth.service', () => ({
  authService: mocks.authService,
}));

vi.mock('../../services/cache.service', () => ({
  cacheService: mocks.cacheService,
}));

import { me } from '../auth.controller';

const flushAsync = async (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

const createRes = () => {
  const res = {} as Response;
  const status = vi.fn().mockReturnValue(res);
  const json = vi.fn().mockReturnValue(res);
  res.status = status as unknown as Response['status'];
  res.json = json as unknown as Response['json'];
  return { res, status, json };
};

describe('Auth controller cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves /auth/me from cache when available', async () => {
    const cachedUser = { id: 'u1', email: 'cached@example.com' };
    mocks.cacheService.getJson.mockResolvedValue(cachedUser);

    const req = { user: { userId: 'u1' } } as Request;
    const { res, status, json } = createRes();
    const next = vi.fn() as NextFunction;

    me(req, res, next);
    await flushAsync();

    expect(mocks.cacheService.getJson).toHaveBeenCalledWith('auth:me:u1');
    expect(mocks.authService.me).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: cachedUser,
    });
  });

  it('fetches /auth/me from service and caches on miss', async () => {
    const user = { id: 'u1', email: 'fresh@example.com' };
    mocks.cacheService.getJson.mockResolvedValue(null);
    mocks.authService.me.mockResolvedValue(user);

    const req = { user: { userId: 'u1' } } as Request;
    const { res, status, json } = createRes();
    const next = vi.fn() as NextFunction;

    me(req, res, next);
    await flushAsync();

    expect(mocks.authService.me).toHaveBeenCalledWith('u1');
    expect(mocks.cacheService.setJson).toHaveBeenCalledWith(
      'auth:me:u1',
      user,
      60
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: user,
    });
  });
});
