import { Router } from 'express';
import { healthLive, healthReady } from '../controllers/health.controller';

const healthRoutes = Router();

// Liveness: process is up.
healthRoutes.get('/', healthLive);

// Readiness: dependencies are healthy (DB, etc.).
healthRoutes.get('/ready', healthReady);

export default healthRoutes;

