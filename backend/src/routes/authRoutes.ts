import { Router } from 'express';
import { signup, login, getMe, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Routes d'authentification
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export default router;
