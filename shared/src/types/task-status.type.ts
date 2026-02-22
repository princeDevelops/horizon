export const TASK_STATUS = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in-progress',
  PENDING: 'pending',
} as const;

type TaskStatusObject = typeof TASK_STATUS;
type TaskStatusKeys = keyof TaskStatusObject;

export type TaskStatus = TaskStatusObject[TaskStatusKeys];
