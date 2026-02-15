import { TaskPriority } from '../types/task-priority.type';
import { TaskStatus } from '../types/task-status.type';
import { Tag } from '../types/task-tag.type';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;

  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  startDate?: string;
  finishedAt?: string;
  deletedAt?: string;

  isArchived: boolean;
  isPinned?: boolean;

  tags?: Tag[];
  customTags?: string[];
}
