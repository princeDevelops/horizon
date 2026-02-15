import app from './app/app';
import { logger } from './utils/logger';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Horizon Server is up and running on http://localhost:${PORT}/`);
});
