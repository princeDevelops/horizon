import mongoose from 'mongoose';

export const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null;

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const enumValues = <T extends string>(obj: Record<string, T>): T[] =>
  Object.values(obj);

export const isValidMongoId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

