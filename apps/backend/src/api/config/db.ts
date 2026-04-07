import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

/** Connects to MongoDB and lets startup decide whether failures are fatal. */
export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/horizon';

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  logger.info('MongoDB connected successfully');
};
