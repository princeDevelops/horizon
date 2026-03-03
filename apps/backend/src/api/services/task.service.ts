import {
  TASK_STATUS,
  type CreateTaskInput,
  type DeleteTaskInput,
  type Task,
  type UpdateTaskInput,
  type BulkUpdateTaskFlagsInput,
} from '@horizon/shared';

import { logger } from '../../utils/logger';
import { validateTaskDateRangeOrThrow } from '../../utils/validation';
import { ErrorFactory } from '../errors/errors';
import { TaskModel, type TaskDocument } from '../models/task.model';
import { taskRepository } from '../repositories/task.repository';

/** Maps a Mongoose task document to the API task contract. */
const mapTaskDocumentToTask = (taskDoc: TaskDocument): Task => ({
  userId: taskDoc.userId.toString(),
  id: taskDoc._id.toString(),
  title: taskDoc.title,
  status: taskDoc.status,
  priority: taskDoc.priority,
  description: taskDoc.description,
  createdAt: taskDoc.createdAt.toISOString(),
  updatedAt: taskDoc.updatedAt?.toISOString(),
  dueDate: taskDoc.dueDate,
  startDate: taskDoc.startDate,
  finishedAt: taskDoc.finishedAt,
  isArchived: taskDoc.isArchived,
  isPinned: taskDoc.isPinned,
  tags: taskDoc.tags,
  customTags: taskDoc.customTags,
});

export const taskService = {
  /** Creates a task for the authenticated user. */
  async createTask(input: CreateTaskInput, userId: string): Promise<Task> {
    const title = input.title;
    const createdTask = await taskRepository.createTask({
      ...input,
      userId,
      title,
    });

    return mapTaskDocumentToTask(createdTask);
  },

  /** Returns paginated tasks for a user using filter and sort options. */
  async getAllTasks({
    userId,
    filter,
    sort,
    page,
    limit,
  }: {
    userId: string;
    filter: Record<string, unknown>;
    sort?: Record<string, 1 | -1 | 'asc' | 'desc'>;
    page: number;
    limit: number;
  }): Promise<Task[]> {
    const skip = (page - 1) * limit;
    const queryFilter = { ...filter, userId };

    logger.info('MongoDB query executing', { filter: queryFilter, sort, skip, limit });

    const tasks = await TaskModel.find(queryFilter as any)
      .sort(sort ?? { createdAt: 'desc' })
      .skip(skip)
      .limit(limit)
      .exec();

    logger.info('MongoDB query completed', { taskCount: tasks.length });

    return tasks.map(mapTaskDocumentToTask);
  },

  /** Deletes a single task by id for the authenticated user. */
  async deleteTask(input: DeleteTaskInput, userId: string): Promise<Task> {
    const deletedTask = await taskRepository.deleteTask(input, userId);

    if (!deletedTask) {
      throw ErrorFactory.notFound('Task', input.id);
    }

    return mapTaskDocumentToTask(deletedTask);
  },

  /** Updates a task and derives completion timestamps from status transitions. */
  async updateTask(input: UpdateTaskInput, userId: string): Promise<Task> {
    const existingTask = await taskRepository.findTaskById(input.id, userId);
    if (!existingTask) throw ErrorFactory.notFound('Task', input.id);

    validateTaskDateRangeOrThrow(
      input.startDate ?? existingTask.startDate,
      input.dueDate ?? existingTask.dueDate
    );

    const nextInput = { ...input };
    let unsetFinishedAt = false;

    if (
      input.status === TASK_STATUS.COMPLETED &&
      existingTask.status !== TASK_STATUS.COMPLETED
    ) {
      nextInput.finishedAt = new Date().toISOString();
    }

    if (input.status && input.status !== TASK_STATUS.COMPLETED) {
      unsetFinishedAt = true;
    }

    const updatedTask = await taskRepository.updateTask(nextInput, userId, {
      unsetFinishedAt,
    });

    if (!updatedTask) {
      throw ErrorFactory.notFound('Task', input.id);
    }

    return mapTaskDocumentToTask(updatedTask);
  },

  /** Deletes multiple tasks and returns the deleted records. */
  async deleteSelectedTasks(
    ids: DeleteTaskInput[],
    userId: string
  ): Promise<{ deletedCount: number; deletedTasks: Task[] }> {
    const { deletedCount, deletedTasks } =
      await taskRepository.deleteSelectedTasks(ids, userId);

    if (deletedCount === 0) {
      throw ErrorFactory.notFound('Tasks', ids.map((id) => id.id).join(', '));
    }

    logger.info('Deleted selected tasks', {
      deletedCount,
      deletedTaskIds: deletedTasks.map((task) => task._id.toString()),
      deletedTasks,
    });

    return {
      deletedCount,
      deletedTasks: deletedTasks.map(mapTaskDocumentToTask),
    };
  },

  /** Applies bulk archive/pin flag updates for the provided task ids. */
  async updateTaskFlagsBulk(
    input: BulkUpdateTaskFlagsInput,
    userId: string
  ): Promise<{ modifiedCount: number; updatedTasks: Task[] }> {
    const { ids, isArchived, isPinned } = input;

    const { matchedCount, modifiedCount, updatedTasks } =
      await taskRepository.bulkUpdateTaskFlags(ids, userId, {
        isArchived,
        isPinned,
      });

    if (matchedCount === 0) {
      throw ErrorFactory.notFound('Tasks', ids.join(', '));
    }

    return {
      modifiedCount,
      updatedTasks: updatedTasks.map(mapTaskDocumentToTask),
    };
  },
};
