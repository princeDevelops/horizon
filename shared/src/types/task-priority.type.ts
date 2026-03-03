export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

/** Internal object type used to derive the priority union. */
type TaskPriorityObject = typeof TASK_PRIORITY;

/** Key union of `TASK_PRIORITY`. */
type TaskPriorityKeys = keyof TaskPriorityObject;

/** Value union of all supported task priority literals. */
export type TaskPriority = TaskPriorityObject[TaskPriorityKeys];
