import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { expectErrorResponse } from '../../../../test/helpers/contracts';

describe('Auth middleware', () => {
  it('returns 401 when /api/v1/auth/me is called without bearer token', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expectErrorResponse(response.body, 401, 'UNAUTHORIZED');
  });
});
