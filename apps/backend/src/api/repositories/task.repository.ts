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

  // deleting a task from DB
  async deleteTask(
    input: DeleteTaskInput,
    userId: string
  ): Promise<TaskDocument | null> {
    return await TaskModel.findOneAndDelete({ _id: input.id, userId });
  },

  // updating a task in DB
  async updateTask(
    input: UpdateTaskInput,
    userId: string,
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

    return await TaskModel.findOneAndUpdate({ _id: id, userId }, updateQuery, {
      returnDocument: 'after',
    });
  },

  // find a task by id
  async findTaskById(id: string, userId: string): Promise<TaskDocument | null> {
    return await TaskModel.findOne({ _id: id, userId });
  },

  // deleting selected tasks from DB -> returning count and list of deleted tasks
  async deleteSelectedTasks(
    ids: DeleteTaskInput[],
    userId: string
  ): Promise<{ deletedCount: number; deletedTasks: TaskDocument[] }> {
    const toBeDeletedIds = ids.map((taskId) => taskId.id);
    const deletedTasks = await TaskModel.find({
      _id: { $in: toBeDeletedIds },
      userId,
    });
    const result = await TaskModel.deleteMany({ _id: { $in: toBeDeletedIds }, userId });
    return { deletedCount: result.deletedCount || 0, deletedTasks };
  },

  async bulkUpdateTaskFlags(
    ids: string[],
    userId: string,
    flags: { isArchived?: boolean; isPinned?: boolean }
  ): Promise<{
    matchedCount: number;
    modifiedCount: number;
    updatedTasks: TaskDocument[];
  }> {
    const updateData: { isArchived?: boolean; isPinned?: boolean } = {};

    if (typeof flags.isArchived === 'boolean') {
      updateData.isArchived = flags.isArchived;
    }

    if (typeof flags.isPinned === 'boolean') {
      updateData.isPinned = flags.isPinned;
    }

    const result = await TaskModel.updateMany(
      { _id: { $in: ids }, userId },
      { $set: updateData }
    );

    const updatedTasks = await TaskModel.find({ _id: { $in: ids }, userId });

    return {
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      updatedTasks,
    };
  },
};
