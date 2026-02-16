import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
} from '../controllers/task.controller';

const taskRoutes = Router();

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);
taskRoutes.route('/:taskId').delete(deleteTask);

export default taskRoutes;
