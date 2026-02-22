import { TaskPriority, TaskStatus, Tag } from '../types';
export interface CreateTaskInput {
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
