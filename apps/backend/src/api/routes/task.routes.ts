import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
  updateTask,
  deleteSelectedTasks,
  updateTaskFlagsBulk,
} from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';

const taskRoutes = Router();

/** All task routes require authentication. */
taskRoutes.use(requireAuth);

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);
taskRoutes.route('/bulk/flags').patch(updateTaskFlagsBulk);
taskRoutes.route('/bulk').delete(deleteSelectedTasks);
taskRoutes.route('/:id').delete(deleteTask).patch(updateTask);

export default taskRoutes;
