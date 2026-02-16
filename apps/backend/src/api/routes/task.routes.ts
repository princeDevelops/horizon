import { Router } from 'express';
import { createTask, getAllTasks } from '../controllers/task.controller';

const taskRoutes = Router();

taskRoutes.route('/').post(createTask);
taskRoutes.route('/').get(getAllTasks);

export default taskRoutes;
