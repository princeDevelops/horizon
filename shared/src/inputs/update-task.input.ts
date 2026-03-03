import { type Tag, type TaskPriority, type TaskStatus } from '../types';

/** Payload contract for partial task updates. */
export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  startDate?: string;
  isArchived?: boolean;
  isPinned?: boolean;
  finishedAt?: string;
  tags?: Tag[];
  customTags?: string[];
}
