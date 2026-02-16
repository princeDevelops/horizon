import { type CreateTaskInput, type DeleteTaskInput } from '@horizon/shared';
import { TaskModel, type TaskDocument } from '../models/task.model';

export const taskRepository = {
  // creating a task in DB
  async createTask(input: CreateTaskInput): Promise<TaskDocument> {
    return await TaskModel.create(input);
  },

  // getting all tasks from DB
  async getAllTasks(): Promise<TaskDocument[]> {
    return await TaskModel.find();
  },

  // deleting a task from DB
  async deleteTask(input: DeleteTaskInput): Promise<TaskDocument | null> {
    return await TaskModel.findByIdAndDelete(input.taskId);
  },

  // TODO : deleting selected tasks from DB
};
