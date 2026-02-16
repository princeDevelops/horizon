import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
export const connectDB = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/horizon';
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
