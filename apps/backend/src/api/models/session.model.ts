import mongoose, { type Document } from 'mongoose';
import type { Session } from '@horizon/shared';


// Session shape persisted in MongoDB (excluding virtual/derived fields).
type SessionPersistence = Omit<
  Session,
  'createdAt' | 'updatedAt' | 'revokedAt' | 'expiresAt'
> & { expiresAt: Date; revokedAt?: Date };


// Mongoose session document contract with Date timestamps.
export interface SessionDocument extends SessionPersistence, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Session collection schema with TTL index for automatic expiration.
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

/** TTL index: sessions expire exactly at `expiresAt`. */
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, revokedAt: 1 });
export const SessionModel = mongoose.model<SessionDocument>(
  'Session',
  SessionSchema
);
