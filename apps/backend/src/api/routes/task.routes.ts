import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
  updateTask,
} from '../controllers/task.controller';

const taskRoutes = Router();

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);
taskRoutes.route('/:taskId').delete(deleteTask).patch(updateTask);

export default taskRoutes;
