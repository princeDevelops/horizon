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
  async updateTask(
    input: UpdateTaskInput,
    options?: { unsetFinishedAt?: boolean }
  ): Promise<TaskDocument | null> {
    const { id, ...updateData } = input;
    const updateQuery: {
      $set: Omit<UpdateTaskInput, 'id'>;
      $unset?: { finishedAt: 1 };
    } = {
      $set: updateData,
    };

    if (options?.unsetFinishedAt) {
      updateQuery.$unset = { finishedAt: 1 };
    }

    return await TaskModel.findByIdAndUpdate(id, updateQuery, {
      returnDocument: 'after',
    });
  },

  // find a task by id
  async findTaskById(id: string): Promise<TaskDocument | null> {
    return await TaskModel.findById(id);
  },

  // deleting selected tasks from DB -> returning count and list of deleted tasks
  async deleteSelectedTasks(
    ids: DeleteTaskInput[]
  ): Promise<{ deletedCount: number; deletedTasks: TaskDocument[] }> {
    const toBeDeletedIds = ids.map((taskId) => taskId.id);
    const deletedTasks = await TaskModel.find({ _id: { $in: toBeDeletedIds } });
    const result = await TaskModel.deleteMany({ _id: { $in: toBeDeletedIds } });
    return { deletedCount: result.deletedCount || 0, deletedTasks };
  },
};
