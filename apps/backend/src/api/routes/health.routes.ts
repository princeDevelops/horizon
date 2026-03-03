import { Router } from 'express';
import { healthLive, healthReady } from '../controllers/health.controller';

const healthRoutes = Router();

/** Liveness probe endpoint. */
healthRoutes.get('/', healthLive);

/** Readiness probe endpoint. */
healthRoutes.get('/ready', healthReady);

export default healthRoutes;
