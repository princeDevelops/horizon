import { type Tag, type TaskPriority, type TaskStatus } from '../types';

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  startDate?: string;
  tags?: Tag[];
  customTags?: string[];
}
