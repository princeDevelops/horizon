import { logger } from '../utils/logger';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import taskRoutes from './routes/task.routes';
import morgan from 'morgan';

const app = express();

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5000']; 

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in dev, or use: callback(new Error('Not allowed by CORS'));
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

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ ok: true, message: 'Server is responding' });
});

app.use('/api/v1/tasks', taskRoutes);

export default app;
