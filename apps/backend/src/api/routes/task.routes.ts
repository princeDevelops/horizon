import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
  updateTask,
  findTask,
} from '../controllers/task.controller';

const taskRoutes = Router();

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);
taskRoutes.route('/:id').get(findTask).delete(deleteTask).patch(updateTask);

export default taskRoutes;
