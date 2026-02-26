import mongoose, { type Document } from 'mongoose';
import type { Session } from '@horizon/shared';

type SessionPersistence = Omit<
  Session,
  'createdAt' | 'updatedAt' | 'revokedAt' | 'expiresAt'
> & { expiresAt: Date; revokedAt?: Date };

export interface SessionDocument extends SessionPersistence, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new mongoose.Schema<SessionDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

// TTL : document expires exactly at expiresAt time
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, revokedAt: 1 });
export const SessionModel = mongoose.model<SessionDocument>(
  'Session',
  SessionSchema
);
