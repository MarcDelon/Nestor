import { Router } from 'express';
import { signup, login } from '../controllers/authController';

const router = Router();

// Routes d'authentification
router.post('/signup', signup);
router.post('/login', login);

export default router;
