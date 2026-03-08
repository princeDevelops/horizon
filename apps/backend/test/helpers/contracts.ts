import { expect } from 'vitest';
export const expectSuccessResponse = (body: unknown) => {
  expect(body).toMatchObject({
    success: true,
  });
};

export const expectErrorResponse = (
  body: unknown,
  statusCode: number,
  code?: string
) => {
  expect(body).toMatchObject({
    status: statusCode < 500 ? 'fail' : 'error',
    statusCode,
    message: expect.any(String),
    timestamp: expect.any(String),
  });

  if (code) {
    expect((body as Record<string, unknown>).code).toBe(code);
  }
};
