import mongoose, { type Document } from 'mongoose';
import { type User, USER_ROLES, AUTH_PROVIDERS } from '@horizon/shared';

/** User shape persisted in MongoDB (excluding virtual/derived fields). */
type UserPersistence = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

/** Mongoose user document contract with Date timestamps. */
export interface UserDocument extends UserPersistence, Document {
  createdAt: Date;
  updatedAt: Date;
}

/** User collection schema covering local and OAuth-based accounts. */
const UserSchema = new mongoose.Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      minlength: 8,
      trim: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    providers: {
      type: [
        {
          provider: {
            type: String,
            enum: Object.values(AUTH_PROVIDERS),
            required: true,
          },
          providerUserId: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

/** Enforces uniqueness for provider identity pairs when present. */
UserSchema.index(
  { 'providers.provider': 1, 'providers.providerUserId': 1 },
  { unique: true, sparse: true }
);

/** Mongoose model for CRUD operations on users. */
export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
