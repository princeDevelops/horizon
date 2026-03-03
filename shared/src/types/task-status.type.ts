/** Lifecycle statuses a task can be in. */
export const TASK_STATUS = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in-progress',
  PENDING: 'pending',
} as const;

/** Internal object type used to derive status unions. */
type TaskStatusObject = typeof TASK_STATUS;
/** Key union of `TASK_STATUS`. */
type TaskStatusKeys = keyof TaskStatusObject;

/** Value union of allowed task status literals. */
export type TaskStatus = TaskStatusObject[TaskStatusKeys];
