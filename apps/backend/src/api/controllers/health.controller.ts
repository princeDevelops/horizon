import type { Request, Response } from 'express';
import mongoose from 'mongoose';

const startedAt = new Date();

const getMongoState = () => {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

export const healthLive = (_req: Request, res: Response): void => {
  res.status(200).json({
    ok: true,
    status: 'live',
    uptimeSec: process.uptime(),
    startedAt: startedAt.toISOString(),
    now: new Date().toISOString(),
  });
};

export const healthReady = (_req: Request, res: Response): void => {
  const mongoState = getMongoState();
  const isReady = mongoState === 'connected';

  res.status(isReady ? 200 : 503).json({
    ok: isReady,
    status: isReady ? 'ready' : 'not_ready',
    checks: {
      database: mongoState,
    },
    now: new Date().toISOString(),
  });
};

