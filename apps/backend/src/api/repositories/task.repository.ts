import { type CreateTaskInput } from '@horizon/shared';
import { TaskModel, type TaskDocument } from '../models/task.model';

export const taskRepository = {
  async createTask(input: CreateTaskInput): Promise<TaskDocument> {
    return TaskModel.create(input);
  },

  async getAllTasks(): Promise<TaskDocument[]> {
    return TaskModel.find();
  },
};
