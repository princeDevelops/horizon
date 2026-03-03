import {
  type CreateTaskInput,
  type DeleteTaskInput,
  GetTasksQuery,
  type UpdateTaskInput,
} from '@horizon/shared';
import type { BulkUpdateTaskFlagsInput } from '@horizon/shared/inputs/bulk-update-task-flags.input';
import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  validateBulkUpdateTaskFlagsInputOrThrow,
  validateTaskIdOrThrow,
  validateTaskIdsOrThrow,
  validateTaskInputOrThrow,
} from '../../utils/validation';
import { logger } from '../../utils/logger';
import { TaskFilters } from '../../utils/task.filters';
import { ErrorFactory } from '../errors/errors';
import { taskService } from '../services/task.service';

/** Returns authenticated user claims or throws `401`. */
const getAuthenticatedUserOrThrow = (req: Request) => {
  if (!req.user) throw ErrorFactory.unauthorized('Authentication required');
  return req.user;
};

/** Creates a task for the current authenticated user. */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const authUser = getAuthenticatedUserOrThrow(req);

  const input: CreateTaskInput = {
    ...req.body,
    userId: authUser.userId,
  };

  validateTaskInputOrThrow(input, 'create');

  logger.info('Creating task with input', { input });
  const task = await taskService.createTask(input, authUser.userId);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task,
  });
});

/** Fetches tasks for the current user using query-based filters and pagination. */
export const getAllTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authUser = getAuthenticatedUserOrThrow(req);

    const tf = new TaskFilters(req.query as unknown as GetTasksQuery);

    const { filter, sort } = { filter: tf.getFilter(), sort: tf.getSort() };
    const { page, limit } = tf.getPagination();

    const filterLog = { rawQuery: req.query, filter, sort, page, limit };
    logger.info('Task filters applied', filterLog);

    const tasks = await taskService.getAllTasks({
      userId: authUser.userId,
      filter,
      sort,
      page,
      limit,
    });

    logger.info('Fetched all tasks', { tasks: tasks });

    res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
    });
  }
);

/** Deletes a task by id for the current user. */
export const deleteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authUser = getAuthenticatedUserOrThrow(req);

    const idParam = req.params.id;

    const input: DeleteTaskInput = {
      id: Array.isArray(idParam) ? idParam[0] : idParam,
    };

    validateTaskIdOrThrow(input.id);

    logger.info('Deleting task', { id: input.id });
    const deletedTask = await taskService.deleteTask(input, authUser.userId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask,
    });
  }
);

/** Updates a task by id for the current user. */
export const updateTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authUser = getAuthenticatedUserOrThrow(req);

    const idParam = req.params.id;

    const input: UpdateTaskInput = {
      id: Array.isArray(idParam) ? idParam[0] : idParam,
      ...req.body,
    };

    validateTaskIdOrThrow(input.id);
    validateTaskInputOrThrow(input, 'update');

    logger.info('Updating task', { id: input.id });
    logger.info('Update payload', { input });
    const updatedTask = await taskService.updateTask(input, authUser.userId);

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  }
);

/** Deletes multiple tasks for the current user. */
export const deleteSelectedTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authUser = getAuthenticatedUserOrThrow(req);

    const uniqueIds: DeleteTaskInput[] = validateTaskIdsOrThrow(
      req.body.ids
    ).map((id) => ({ id }));

    const { deletedCount, deletedTasks } =
      await taskService.deleteSelectedTasks(uniqueIds, authUser.userId);

    res.status(200).json({
      success: true,
      message: `${deletedCount} task(s) deleted successfully`,
      data: deletedTasks,
    });
  }
);

/** Bulk-updates archive/pin flags for the current user's tasks. */
export const updateTaskFlagsBulk = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authUser = getAuthenticatedUserOrThrow(req);

    const input: BulkUpdateTaskFlagsInput =
      validateBulkUpdateTaskFlagsInputOrThrow(
        req.body as BulkUpdateTaskFlagsInput
      );

    const { modifiedCount, updatedTasks } =
      await taskService.updateTaskFlagsBulk(input, authUser.userId);

    res.status(200).json({
      success: true,
      message: `${modifiedCount} task(s) updated successfully`,
      data: updatedTasks,
    });
  }
);
