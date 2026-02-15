import 'dotenv/config';
import { logger } from './utils/logger';
import app from './api/app';
import { connectDB } from './api/config/db';

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Horizon Server is running on port ${PORT}`);
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
