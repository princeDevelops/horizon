import type { BulkUpdateTaskFlagsInput } from '@horizon/shared/inputs/bulk-update-task-flags.input';
import { ErrorFactory } from '../../api/errors/errors';
import { hasValue } from './common.validation';
import { validateTaskIdsOrThrow } from './task.validation';

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

