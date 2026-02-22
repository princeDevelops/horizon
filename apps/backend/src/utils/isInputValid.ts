import {
  TAG,
  TASK_CONSTRAINTS,
  TASK_PRIORITY,
  TASK_STATUS,
  type CreateTaskInput,
  type TaskPriority,
  type TaskStatus,
  type Tag,
  type UpdateTaskInput,
} from '@horizon/shared';
import type { BulkUpdateTaskFlagsInput } from '@horizon/shared/inputs/bulk-update-task-flags.input';
import mongoose from 'mongoose';
import { ErrorFactory } from '../api/errors/errors';

type TaskValidationMode = 'create' | 'update';

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const enumValues = <T extends string>(obj: Record<string, T>): T[] =>
  Object.values(obj);

const isValidMongoId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateTaskIdOrThrow = (id: string): void => {
  if (!isNonEmptyString(id)) {
    throw ErrorFactory.validation(
      'Task ID is required',
      'id',
      'ERR_TASK_ID_REQUIRED'
    );
  }

  if (!isValidMongoId(id)) {
    throw ErrorFactory.validation(
      'Invalid task ID format',
      'id',
      'ERR_INVALID_ID_FORMAT'
    );
  }
};

export const validateTaskInputOrThrow = (
  input: CreateTaskInput | UpdateTaskInput,
  mode: TaskValidationMode
): void => {
  const titleRequired = mode === 'create';

  if (titleRequired && !isNonEmptyString(input.title)) {
    throw ErrorFactory.validation(
      'Title is required',
      'title',
      'ERR_TITLE_REQUIRED'
    );
  }

  if (hasValue(input.title)) {
    if (typeof input.title !== 'string') {
      throw ErrorFactory.validation(
        'Title must be a string',
        'title',
        'ERR_TITLE_INVALID_TYPE'
      );
    }

    if (input.title.trim().length === 0) {
      throw ErrorFactory.validation(
        'Title cannot be empty',
        'title',
        'ERR_TITLE_EMPTY'
      );
    }

    if (input.title.length < TASK_CONSTRAINTS.TITLE_MIN_LENGTH) {
      throw ErrorFactory.validation(
        `Title must be at least ${TASK_CONSTRAINTS.TITLE_MIN_LENGTH} characters`,
        'title',
        'ERR_TITLE_TOO_SHORT'
      );
    }

    if (input.title.length > TASK_CONSTRAINTS.TITLE_MAX_LENGTH) {
      throw ErrorFactory.validation(
        `Title must be less than ${TASK_CONSTRAINTS.TITLE_MAX_LENGTH} characters`,
        'title',
        'ERR_TITLE_TOO_LONG'
      );
    }
  }

  if (hasValue(input.description)) {
    if (typeof input.description !== 'string') {
      throw ErrorFactory.validation(
        'Description must be a string',
        'description',
        'ERR_DESCRIPTION_INVALID_TYPE'
      );
    }

    if (input.description.trim().length === 0) {
      throw ErrorFactory.validation(
        'Description cannot be empty or contain only whitespace',
        'description',
        'ERR_DESCRIPTION_EMPTY'
      );
    }

    if (input.description.length > TASK_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      throw ErrorFactory.validation(
        `Description must be less than ${TASK_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`,
        'description',
        'ERR_DESCRIPTION_TOO_LONG'
      );
    }
  }

  if (hasValue(input.priority)) {
    const allowed = enumValues(TASK_PRIORITY);
    if (!allowed.includes(input.priority as TaskPriority)) {
      throw ErrorFactory.validation(
        `Priority must be one of: ${allowed.join(', ')}`,
        'priority',
        'ERR_INVALID_PRIORITY'
      );
    }
  }

  if (hasValue(input.status)) {
    const allowed = enumValues(TASK_STATUS);
    if (!allowed.includes(input.status as TaskStatus)) {
      throw ErrorFactory.validation(
        `Status must be one of: ${allowed.join(', ')}`,
        'status',
        'ERR_INVALID_STATUS'
      );
    }
  }

  if (hasValue(input.tags)) {
    if (!Array.isArray(input.tags)) {
      throw ErrorFactory.validation(
        'Tags must be an array',
        'tags',
        'ERR_TAGS_INVALID_TYPE'
      );
    }

    const allowed = enumValues(TAG);
    const invalid = input.tags.find((tag) => !allowed.includes(tag as Tag));
    if (invalid) {
      throw ErrorFactory.validation(
        `Invalid tag '${invalid}'. Allowed: ${allowed.join(', ')}`,
        'tags',
        'ERR_INVALID_TAG'
      );
    }
  }

  if (hasValue(input.customTags) && !Array.isArray(input.customTags)) {
    throw ErrorFactory.validation(
      'customTags must be an array',
      'customTags',
      'ERR_CUSTOM_TAGS_INVALID_TYPE'
    );
  }

  // check for pinned field and ensure it's a boolean if provided
  if (hasValue(input.isPinned) && typeof input.isPinned !== 'boolean') {
    throw ErrorFactory.validation(
      'Pinned must be a boolean',
      'isPinned',
      'ERR_PINNED_INVALID_TYPE'
    );
  }

  // check for archived field and ensure it's a boolean if provided
  if (hasValue(input.isArchived) && typeof input.isArchived !== 'boolean') {
    throw ErrorFactory.validation(
      'Archived must be a boolean',
      'isArchived',
      'ERR_ARCHIVED_INVALID_TYPE'
    );
  }
};

export const validateTaskIdsOrThrow = (ids: unknown): string[] => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ErrorFactory.validation(
      'ids must be a non-empty array',
      'ids',
      'ERR_TASK_IDS_REQUIRED'
    );
  }

  if (!ids.every((id) => typeof id === 'string')) {
    throw ErrorFactory.validation(
      'all ids must be strings',
      'ids',
      'ERR_TASK_IDS_INVALID_TYPE'
    );
  }

  const trimmedIds = ids.map((id) => id.trim()).filter((id) => id.length > 0);

  if (trimmedIds.length === 0) {
    throw ErrorFactory.validation(
      'ids must contain at least one valid task id',
      'ids',
      'ERR_TASK_IDS_REQUIRED'
    );
  }

  trimmedIds.forEach((id) => validateTaskIdOrThrow(id));

  return Array.from(new Set(trimmedIds));
};

export const validateBulkUpdateTaskFlagsInputOrThrow = (
  input: BulkUpdateTaskFlagsInput
): BulkUpdateTaskFlagsInput => {
  const ids = validateTaskIdsOrThrow(input.ids);

  const hasPinned = hasValue(input.isPinned);
  const hasArchived = hasValue(input.isArchived);

  if (!hasPinned && !hasArchived) {
    throw ErrorFactory.validation(
      'At least one of isPinned or isArchived must be provided',
      'isPinned',
      'ERR_TASK_FLAGS_REQUIRED'
    );
  }

  if (hasPinned && typeof input.isPinned !== 'boolean') {
    throw ErrorFactory.validation(
      'Pinned must be a boolean',
      'isPinned',
      'ERR_PINNED_INVALID_TYPE'
    );
  }

  if (hasArchived && typeof input.isArchived !== 'boolean') {
    throw ErrorFactory.validation(
      'Archived must be a boolean',
      'isArchived',
      'ERR_ARCHIVED_INVALID_TYPE'
    );
  }

  return {
    ids,
    ...(hasPinned ? { isPinned: input.isPinned } : {}),
    ...(hasArchived ? { isArchived: input.isArchived } : {}),
  };
};
