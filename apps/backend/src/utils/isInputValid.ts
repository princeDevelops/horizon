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

const parseDateOrThrow = (
  value: unknown,
  field: 'startDate' | 'dueDate'
): Date => {
  if (typeof value !== 'string') {
    throw ErrorFactory.validation(
      `${field} must be a valid ISO 8601 date string`,
      field,
      field === 'startDate'
        ? 'ERR_START_DATE_INVALID_TYPE'
        : 'ERR_DUE_DATE_INVALID_TYPE'
    );
  }

  if (value.trim().length === 0) {
    throw ErrorFactory.validation(
      `${field} cannot be empty`,
      field,
      field === 'startDate' ? 'ERR_START_DATE_EMPTY' : 'ERR_DUE_DATE_EMPTY'
    );
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw ErrorFactory.validation(
      `${field} must be a valid ISO 8601 date string`,
      field,
      field === 'startDate' ? 'ERR_START_DATE_INVALID' : 'ERR_DUE_DATE_INVALID'
    );
  }

  return parsedDate;
};

const validateDateOrderOrThrow = (
  startDate?: string,
  dueDate?: string
): void => {
  if (!hasValue(startDate) || !hasValue(dueDate)) {
    return;
  }

  const parsedStartDate = parseDateOrThrow(startDate, 'startDate');
  const parsedDueDate = parseDateOrThrow(dueDate, 'dueDate');

  if (parsedStartDate.getTime() > parsedDueDate.getTime()) {
    throw ErrorFactory.validation(
      'startDate must be less than or equal to dueDate',
      'startDate',
      'ERR_START_DATE_AFTER_DUE_DATE'
    );
  }
};

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
  let parsedDueDate: Date | undefined;
  let parsedStartDate: Date | undefined;
  const titleRequired = mode === 'create';
  const userIdRequired = mode === 'create';

  if (userIdRequired) {
    const userId = (input as CreateTaskInput).userId;

    if (!isNonEmptyString(userId)) {
      throw ErrorFactory.validation(
        'userId is required',
        'userId',
        'ERR_USER_ID_REQUIRED'
      );
    }

    if (!isValidMongoId(userId)) {
      throw ErrorFactory.validation(
        'Invalid userId format',
        'userId',
        'ERR_INVALID_USER_ID_FORMAT'
      );
    }
  }

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

  if (hasValue(input.startDate)) {
    parsedStartDate = parseDateOrThrow(input.startDate, 'startDate');
  }

  if (hasValue(input.dueDate)) {
    parsedDueDate = parseDateOrThrow(input.dueDate, 'dueDate');
  }

  if (
    mode === 'create' &&
    parsedDueDate &&
    parsedDueDate.getTime() < Date.now()
  ) {
    throw ErrorFactory.validation(
      'dueDate cannot be in the past for new tasks',
      'dueDate',
      'ERR_DUE_DATE_IN_PAST'
    );
  }

  if (parsedStartDate && parsedDueDate) {
    validateDateOrderOrThrow(input.startDate, input.dueDate);
  }

  if (hasValue(input.tags)) {
    if (!Array.isArray(input.tags)) {
      throw ErrorFactory.validation(
        'Tags must be an array',
        'tags',
        'ERR_TAGS_INVALID_TYPE'
      );
    }

    if (input.tags.length > TASK_CONSTRAINTS.MAX_TAGS_COUNT) {
      throw ErrorFactory.validation(
        `Tags cannot exceed ${TASK_CONSTRAINTS.MAX_TAGS_COUNT}`,
        'tags',
        'ERR_TAGS_MAX_COUNT_EXCEEDED'
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

  if (hasValue(input.customTags) && Array.isArray(input.customTags)) {
    if (input.customTags.length > TASK_CONSTRAINTS.MAX_CUSTOM_TAGS_COUNT) {
      throw ErrorFactory.validation(
        `customTags cannot exceed ${TASK_CONSTRAINTS.MAX_CUSTOM_TAGS_COUNT}`,
        'customTags',
        'ERR_CUSTOM_TAGS_MAX_COUNT_EXCEEDED'
      );
    }

    const nonStringTag = input.customTags.find(
      (customTag) => typeof customTag !== 'string'
    );
    if (nonStringTag !== undefined) {
      throw ErrorFactory.validation(
        'Each custom tag must be a string',
        'customTags',
        'ERR_CUSTOM_TAG_INVALID_TYPE'
      );
    }

    const tooLongCustomTag = input.customTags.find(
      (customTag) => customTag.length > TASK_CONSTRAINTS.MAX_CUSTOM_TAGS_LENGTH
    );
    if (tooLongCustomTag) {
      throw ErrorFactory.validation(
        `Custom tag '${tooLongCustomTag}' exceeds ${TASK_CONSTRAINTS.MAX_CUSTOM_TAGS_LENGTH} characters`,
        'customTags',
        'ERR_CUSTOM_TAG_TOO_LONG'
      );
    }
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

export const validateTaskDateRangeOrThrow = (
  startDate?: string,
  dueDate?: string
): void => {
  validateDateOrderOrThrow(startDate, dueDate);
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
