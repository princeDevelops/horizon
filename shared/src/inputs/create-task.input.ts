import { TaskPriority, TaskStatus, Tag } from '../types';

/** Payload contract for creating a new task. */
export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  startDate?: string;
  isArchived?: boolean;
  isPinned?: boolean;
  tags?: Tag[];
  customTags?: string[];
}
