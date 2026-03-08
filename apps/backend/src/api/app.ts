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
import { globalApiLimiter } from './middleware/rate-limit.middleware';

const app = express();

app.set('trust proxy', 1);
app.set('query parser', 'extended');
app.use(cookieParser());
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      logger.warn('CORS request blocked for disallowed origin', { origin });
      return callback(new Error('Not allowed by CORS'));
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
app.use('/api/v1/tasks', globalApiLimiter, taskRoutes);
app.use(errorHandler);

export default app;
