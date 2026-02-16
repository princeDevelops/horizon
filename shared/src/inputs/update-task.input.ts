export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: number;
  status?: number;
  dueDate?: string;
  startDate?: string;
  tags?: string[];
  customTags?: string[];
}
