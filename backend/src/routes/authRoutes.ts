import { Router } from 'express';
import { signup, login, getMe, logout, forgotPassword, resetPassword } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Routes d'authentification
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

// Routes de récupération de mot de passe
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
