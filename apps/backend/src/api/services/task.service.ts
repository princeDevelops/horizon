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
  // creating a task
  async createTask(input: CreateTaskInput, userId: string): Promise<Task> {
    const title = input.title;
    const createdTask = await taskRepository.createTask({
      ...input,
      userId,
      title,
    });

    return mapTaskDocumentToTask(createdTask);
  },

  // getting all the tasks
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

  // deleting a task
  async deleteTask(input: DeleteTaskInput, userId: string): Promise<Task> {
    const deletedTask = await taskRepository.deleteTask(input, userId);

    if (!deletedTask) {
      throw ErrorFactory.notFound('Task', input.id);
    }

    return mapTaskDocumentToTask(deletedTask);
  },

  // updating a task
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

  // TODO : deleting selected tasks
  async deleteSelectedTasks(
    ids: DeleteTaskInput[],
    userId: string
  ): Promise<{ deletedCount: number; deletedTasks: Task[] }> {
    const { deletedCount, deletedTasks } =
      await taskRepository.deleteSelectedTasks(ids, userId);

    // checking if any tasks were deleted
    if (deletedCount === 0) {
      throw ErrorFactory.notFound('Tasks', ids.map((id) => id.id).join(', '));
    }

    // log the count of deleted tasks and their ids and objects
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

  // bulk updating task flags (isArchived, isPinned)
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
