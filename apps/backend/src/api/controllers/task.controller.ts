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
} from '../../utils/isInputValid';
import { logger } from '../../utils/logger';
import { TaskFilters } from '../../utils/task.filters';
import { taskService } from '../services/task.service';

// creating a task

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateTaskInput = req.body;

  validateTaskInputOrThrow(input, 'create');

  logger.info('Creating task with input', { input });
  // Create task
  const task = await taskService.createTask(input);

  // Send response
  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task,
  });
});

// Getting all tasks
export const getAllTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tf = new TaskFilters(req.query as unknown as GetTasksQuery);

    const { filter, sort } = { filter: tf.getFilter(), sort: tf.getSort() };
    const { page, limit } = tf.getPagination();

    const filterLog = { rawQuery: req.query, filter, sort, page, limit };
    logger.info('Task filters applied', filterLog);

    const tasks = await taskService.getAllTasks({ filter, sort, page, limit });

    // log the tasks
    logger.info('Fetched all tasks', { tasks: tasks });

    res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
    });
  }
);

// deleting a task by id
export const deleteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.id;

    const input: DeleteTaskInput = {
      id: Array.isArray(idParam) ? idParam[0] : idParam,
    };

    validateTaskIdOrThrow(input.id);

    logger.info('Deleting task', { id: input.id });
    const deletedTask = await taskService.deleteTask(input);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask,
    });
  }
);

// updating a task by id
export const updateTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.id;

    const input: UpdateTaskInput = {
      id: Array.isArray(idParam) ? idParam[0] : idParam,
      ...req.body,
    };

    validateTaskIdOrThrow(input.id);
    validateTaskInputOrThrow(input, 'update');

    logger.info('Updating task', { id: input.id });
    logger.info('Update payload', { input });
    const updatedTask = await taskService.updateTask(input);

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  }
);

// deleting selected tasks by ids
export const deleteSelectedTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const uniqueIds: DeleteTaskInput[] = validateTaskIdsOrThrow(
      req.body.ids
    ).map((id) => ({ id }));

    const { deletedCount, deletedTasks } =
      await taskService.deleteSelectedTasks(uniqueIds);

    res.status(200).json({
      success: true,
      message: `${deletedCount} task(s) deleted successfully`,
      data: deletedTasks,
    });
  }
);

// bulk update task flags (archive/unarchive, pin/unpin)
export const updateTaskFlagsBulk = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input: BulkUpdateTaskFlagsInput =
      validateBulkUpdateTaskFlagsInputOrThrow(
        req.body as BulkUpdateTaskFlagsInput
      );

    const { modifiedCount, updatedTasks } =
      await taskService.updateTaskFlagsBulk(input);

    res.status(200).json({
      success: true,
      message: `${modifiedCount} task(s) updated successfully`,
      data: updatedTasks,
    });
  }
);
