import { describe, expect, it } from 'vitest';
import { SessionModel } from '../session.model';

describe('SessionModel', () => {
  it('validates required fields', () => {
    const doc = new SessionModel({});
    const error = doc.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors.userId).toBeDefined();
    expect(error?.errors.refreshTokenHash).toBeDefined();
    expect(error?.errors.expiresAt).toBeDefined();
  });

  it('accepts optional metadata fields', () => {
    const doc = new SessionModel({
      userId: 'user-123',
      refreshTokenHash: 'hash-123',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      userAgent: 'vitest-agent',
      ipAddress: '127.0.0.1',
    });

    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it('defines TTL and compound indexes', () => {
    const indexes = SessionModel.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
        [{ userId: 1, revokedAt: 1 }, expect.any(Object)],
      ])
    );
  });
});
