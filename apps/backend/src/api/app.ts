import { logger } from '../utils/logger';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import morgan from 'morgan';
import { errorHandler } from './middleware/error-handler.middleware';
import cookieParser from 'cookie-parser';

const app = express();

app.set('query parser', 'extended');
app.use(cookieParser());
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan('dev', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use(errorHandler);

export default app;
