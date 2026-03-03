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

const authRoutes = Router();

authRoutes.post('/signup', signup);
authRoutes.post('/login', login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
authRoutes.get('/me', requireAuth, me);

authRoutes.get('/oauth/:provider/start', oauthStart);
authRoutes.get('/oauth/:provider/callback', oauthCallback);

export default authRoutes;
