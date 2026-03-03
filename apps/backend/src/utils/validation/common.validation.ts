import mongoose from 'mongoose';

/** Returns `true` when the value is neither `undefined` nor `null`. */
export const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null;


/** Type guard for trimmed non-empty strings. */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;


/** Returns all string enum values from a constant object. */
export const enumValues = <T extends string>(obj: Record<string, T>): T[] =>
  Object.values(obj);

/** Validates Mongo ObjectId format using Mongoose. */
export const isValidMongoId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);
