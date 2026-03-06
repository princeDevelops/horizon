import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Health endpoints', () => {
  it('GET /api/v1/health returns live payload', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.status).toBe('live');
    expect(typeof response.body.uptimeSec).toBe('number');
  });

  it('GET /api/v1/health/ready returns readiness shape', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('checks');
    expect(response.body.checks).toHaveProperty('database');
  });
});
