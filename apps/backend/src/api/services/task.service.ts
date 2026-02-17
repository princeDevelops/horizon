import {
  type DeleteTaskInput,
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
  type FindTaskInput,
} from '@horizon/shared';
import { logger } from '../../utils/logger';
import { type TaskDocument } from '../models/task.model';
import { taskRepository } from '../repositories/task.repository';
import { ErrorFactory } from '../errors/errors';

const mapTaskDocumentToTask = (taskDoc: TaskDocument): Task => ({
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
  deletedAt: taskDoc.deletedAt,
  isArchived: taskDoc.isArchived,
  isPinned: taskDoc.isPinned,
  tags: taskDoc.tags,
  customTags: taskDoc.customTags,
});

export const taskService = {
  // creating a task
  async createTask(input: CreateTaskInput): Promise<Task> {
    const title = input.title;
    const createdTask = await taskRepository.createTask({
      ...input,
      title,
    });

    return mapTaskDocumentToTask(createdTask);
  },

  // getting all the tasks
  async getAllTasks(): Promise<Task[]> {
    const allTasks = await taskRepository.getAllTasks();
    logger.info('Fetched tasks', { count: allTasks.length });
    return allTasks.map(mapTaskDocumentToTask);
  },

  // deleting a task
  async deleteTask(input: DeleteTaskInput): Promise<Task> {
    const deletedTask = await taskRepository.deleteTask(input);

    if (!deletedTask) {
      throw ErrorFactory.notFound('Task', input.id);
    }

    return mapTaskDocumentToTask(deletedTask);
  },

  // updating a task
  async updateTask(input: UpdateTaskInput): Promise<Task> {
    const updatedTask = await taskRepository.updateTask(input);

    if (!updatedTask) {
      throw ErrorFactory.notFound('Task', input.id);
    }

    return mapTaskDocumentToTask(updatedTask);
  },

  // find task by id
  async findTask(input: FindTaskInput): Promise<Task> {
    const foundTask = await taskRepository.findTask(input);

    if (!foundTask) {
      throw ErrorFactory.notFound('Task', input.id);
    }

    return mapTaskDocumentToTask(foundTask);
  },
  // TODO : deleting selected tasks
};
