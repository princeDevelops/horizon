import 'dotenv/config';
import { logger } from './utils/logger';
import app from './api/app';
import { connectDB } from './api/config/db';
import { connectRedis } from './api/config/redis';

const PORT = process.env.PORT || 5000;

/** Starts HTTP server and initializes database connection in the background. */
const bootstrap = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Horizon Server is running on port ${PORT}`);
    });

    connectDB().catch((error) => {
      logger.error('Failed to connect to MongoDB:', error);
      logger.warn('Server is running but database is not connected');
    });

    connectRedis().catch((error) => {
      logger.error('Failed to connect to Redis:', error);
      logger.warn('Server is running but Redis cache is not connected');
    });
  } catch (error) {
    logger.error('Error starting the server:', error);
    process.exit(1);
  }
};

bootstrap().catch((error) => {
  logger.error('Unexpected error during server startup:', error);
  process.exit(1);
});
