export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Getting the TYPE of the TASK_PRIORITY object
type TaskPriorityObject = typeof TASK_PRIORITY;
// Result: { readonly LOW: "low"; readonly MEDIUM: "medium"; readonly HIGH: "high"; readonly URGENT: "urgent"; }

// Getting all the KEYS of that object type
type TaskPriorityKeys = keyof TaskPriorityObject;
// Result: "LOW" | "MEDIUM" | "HIGH" | "URGENT"

// Accessing the VALUES at those keys
export type TaskPriority = TaskPriorityObject[TaskPriorityKeys];
// Result: "low" | "medium" | "high" | "urgent"
