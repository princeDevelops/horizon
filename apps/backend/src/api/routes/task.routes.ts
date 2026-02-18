import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
  updateTask,
  findTask,
  deleteSelectedTasks,
} from '../controllers/task.controller';

const taskRoutes = Router();

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);
taskRoutes.route('/:id').get(findTask).delete(deleteTask).patch(updateTask);
taskRoutes.route('/bulk').delete(deleteSelectedTasks);

export default taskRoutes;
