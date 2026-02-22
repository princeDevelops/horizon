import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
  updateTask,
  deleteSelectedTasks,
  updateTaskFlagsBulk,
} from '../controllers/task.controller';

const taskRoutes = Router();

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);
taskRoutes.route('/bulk/flags').patch(updateTaskFlagsBulk);
taskRoutes.route('/bulk').delete(deleteSelectedTasks);
taskRoutes.route('/:id').delete(deleteTask).patch(updateTask);

export default taskRoutes;
