import {
  type CreateTaskInput,
  type DeleteTaskInput,
  GetTasksQuery,
  type UpdateTaskInput,
} from '@horizon/shared';
import { type Request, type Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  validateTaskIdOrThrow,
  validateTaskInputOrThrow,
} from '../../utils/isInputValid';
import { logger } from '../../utils/logger';
import { TaskFilters } from '../../utils/task.filters';
import { ErrorFactory } from '../errors/errors';
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
    const idsParam = req.body.ids;

    if (!Array.isArray(idsParam) || idsParam.length === 0) {
      throw ErrorFactory.validation(
        'ids must be a non-empty array',
        'ids',
        'ERR_TASK_IDS_REQUIRED'
      );
    }

    if (!idsParam.every((id) => typeof id === 'string')) {
      throw ErrorFactory.validation(
        'all ids must be strings',
        'ids',
        'ERR_TASK_IDS_INVALID_TYPE'
      );
    }

    const ids: DeleteTaskInput[] = idsParam.map((id: string) => ({
      id: id.trim(),
    }));

    // validate each id
    ids.forEach((taskId) => validateTaskIdOrThrow(taskId.id));

    // handling duplicate ids -> merge the duplicates

    const uniqueIds: DeleteTaskInput[] = Array.from(
      new Map(ids.map((item) => [item.id, item])).values()
    );

    const { deletedCount, deletedTasks } =
      await taskService.deleteSelectedTasks(uniqueIds);

    res.status(200).json({
      success: true,
      message: `${deletedCount} task(s) deleted successfully`,
      data: deletedTasks,
    });
  }
);
