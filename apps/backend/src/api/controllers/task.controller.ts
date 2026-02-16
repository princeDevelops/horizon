import { type Request, type Response } from 'express';
import { type DeleteTaskInput, type CreateTaskInput } from '@horizon/shared';
import { logger } from '../../utils/logger';
import { taskService } from '../services/task.service';

export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const input: CreateTaskInput = req.body;
    logger.info('Creating task with input', input);
    const task = await taskService.createTask(input);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to create task', error);

    const message =
      error instanceof Error ? error.message : 'Failed to create task';
    const statusCode = message === 'Title is required' ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getAllTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const allTasks = await taskService.getAllTasks();

    res.status(201).json({
      success: true,
      data: allTasks,
    });
  } catch (error) {
    logger.error('Failed to get all tasks', error);

    const message =
      error instanceof Error ? error.message : 'Failed to get all tasks';
    const statusCode = 404;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const taskIdParam = req.params.taskId;
    const input: DeleteTaskInput = {
      taskId: Array.isArray(taskIdParam) ? taskIdParam[0] : taskIdParam,
    };
    logger.info('deleting task with id :', input);
    const deletedTask = await taskService.deleteTask(input);

    res.status(201).json({
      success: true,
      data: deletedTask,
    });
  } catch (error) {
    logger.error('Failed to delete task', error);

    const message =
      error instanceof Error ? error.message : 'Failed to delete tasks';
    const statusCode = 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};
