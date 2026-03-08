import { Router } from 'express';
import {
  login,
  logout,
  me,
  oauthCallback,
  oauthStart,
  refresh,
  signup,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authStrictLimiter } from '../middleware/rate-limit.middleware';

const authRoutes = Router();

authRoutes.post('/signup', authStrictLimiter, signup);
authRoutes.post('/login', authStrictLimiter, login);
authRoutes.post('/refresh', authStrictLimiter, refresh);
authRoutes.post('/logout', logout);
authRoutes.get('/me', requireAuth, me);

authRoutes.get('/oauth/:provider/start', oauthStart);
authRoutes.get('/oauth/:provider/callback', oauthCallback);

export default authRoutes;
