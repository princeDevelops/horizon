import {
  type CreateTaskInput,
  type DeleteTaskInput,
  type UpdateTaskInput,
} from '@horizon/shared';
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
    return await TaskModel.findByIdAndDelete(input.id);
  },

  // updating a task in DB
  async updateTask(input: UpdateTaskInput): Promise<TaskDocument | null> {
    const { id, ...updateData } = input;
    return await TaskModel.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
    });
  },

  // deleting selected tasks from DB -> returning count and list of deleted tasks
  async deleteSelectedTasks( ids: DeleteTaskInput[]) : Promise<{ deletedCount: number, deletedTasks: TaskDocument[]}>{
    const toBeDeletedIds = ids.map(taskId=> taskId.id);
    const deletedTasks = await TaskModel.find({ _id: { $in: toBeDeletedIds } });
    const result = await TaskModel.deleteMany({ _id: { $in: toBeDeletedIds } });
    return { deletedCount: result.deletedCount || 0, deletedTasks };
  }
};
