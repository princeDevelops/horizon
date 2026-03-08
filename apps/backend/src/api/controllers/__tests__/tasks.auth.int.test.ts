import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { expectErrorResponse } from '../../../../test/helpers/contracts';

describe('Task routes auth guard', () => {
  it('GET /api/v1/tasks returns 401 without Authroization header', async () => {
    const response = await request(app).get('/api/v1/tasks');

    expect(response.status).toBe(401);
    expectErrorResponse(response.body, 401, 'UNAUTHORIZED');
  });

  it('POST /api/v1/tasks returns 401 for invalid bearer token', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', 'Bearer invalid.token.value')
      .send({ title: 'Test Task' });

    expect(response.status).toBe(401);
    expectErrorResponse(response.body, 401, 'UNAUTHORIZED');
  });
});
