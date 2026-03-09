import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const mocks = vi.hoisted(() => ({
  taskService: {
    createTask: vi.fn(),
    getAllTasks: vi.fn(),
  },
  cacheService: {
    getJson: vi.fn(),
    setJson: vi.fn(),
    deleteByPrefix: vi.fn(),
  },
  validation: {
    validateTaskInputOrThrow: vi.fn(),
  },
}));

vi.mock('../../services/task.service', () => ({
  taskService: mocks.taskService,
}));

vi.mock('../../services/cache.service', () => ({
  cacheService: mocks.cacheService,
}));

vi.mock('../../../utils/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/validation')>();
  return {
    ...actual,
    validateTaskInputOrThrow: mocks.validation.validateTaskInputOrThrow,
  };
});

import { createTask, getAllTasks } from '../task.controller';

const flushAsync = async (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

const createRes = () => {
  const res = {} as Response;
  const status = vi.fn().mockReturnValue(res);
  const json = vi.fn().mockReturnValue(res);
  res.status = status as unknown as Response['status'];
  res.json = json as unknown as Response['json'];
  return { res, status, json };
};

describe('Task controller cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves task list from cache on hit', async () => {
    const cachedTasks = [{ id: 't1', title: 'cached task' }];
    mocks.cacheService.getJson.mockResolvedValue(cachedTasks);

    const req = { user: { userId: 'u1' }, query: {} } as unknown as Request;
    const { res, status, json } = createRes();
    const next = vi.fn() as NextFunction;

    getAllTasks(req, res, next);
    await flushAsync();

    expect(mocks.taskService.getAllTasks).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Tasks fetched successfully',
      data: cachedTasks,
    });
  });

  it('fetches task list from service and caches on miss', async () => {
    const freshTasks = [{ id: 't2', title: 'fresh task' }];
    mocks.cacheService.getJson.mockResolvedValue(null);
    mocks.taskService.getAllTasks.mockResolvedValue(freshTasks);

    const req = { user: { userId: 'u1' }, query: {} } as unknown as Request;
    const { res, status, json } = createRes();
    const next = vi.fn() as NextFunction;

    getAllTasks(req, res, next);
    await flushAsync();

    expect(mocks.taskService.getAllTasks).toHaveBeenCalled();
    expect(mocks.cacheService.setJson).toHaveBeenCalledWith(
      expect.stringContaining('tasks:list:u1:'),
      freshTasks,
      30
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Tasks fetched successfully',
      data: freshTasks,
    });
  });

  it('invalidates task list cache after create', async () => {
    const createdTask = { id: 't3', title: 'new task' };
    mocks.taskService.createTask.mockResolvedValue(createdTask);

    const req = {
      user: { userId: 'u1' },
      body: { title: 'new task' },
    } as unknown as Request;
    const { res, status, json } = createRes();
    const next = vi.fn() as NextFunction;

    createTask(req, res, next);
    await flushAsync();

    expect(mocks.taskService.createTask).toHaveBeenCalled();
    expect(mocks.cacheService.deleteByPrefix).toHaveBeenCalledWith('tasks:list:u1:');
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Task created successfully',
      data: createdTask,
    });
  });
});
