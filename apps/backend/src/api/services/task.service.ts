import {
  type DeleteTaskInput,
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
} from '@horizon/shared';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
import { type TaskDocument } from '../models/task.model';
import { taskRepository } from '../repositories/task.repository';

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
    const title = input.title?.trim();

    if (!title) {
      throw new Error('Title is required');
    }

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
    if (!mongoose.Types.ObjectId.isValid(input.taskId)) {
      throw new Error('Invalid task id');
    }

    const deletedTask = await taskRepository.deleteTask(input);

    if (!deletedTask) {
      throw new Error('Task not found');
    }

    return mapTaskDocumentToTask(deletedTask);
  },

  // updating a task
  async updateTask(input: UpdateTaskInput): Promise<Task> {
    if (!mongoose.Types.ObjectId.isValid(input.taskId)) {
      throw new Error('Invalid task id');
    }

    const updatedTask = await taskRepository.updateTask(input);

    if (!updatedTask) {
      throw new Error('Task not found');
    }

    return mapTaskDocumentToTask(updatedTask);
  },

  // TODO : deleting selected tasks
};
