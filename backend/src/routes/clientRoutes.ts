import { Router } from 'express';
import { getClientBillets, getClientColis, reserveTicket } from '../controllers/clientController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Routes Voyageur / Client — toutes protégées
router.get('/billets', requireAuth, getClientBillets);
router.get('/colis', requireAuth, getClientColis);
router.post('/reserver', requireAuth, reserveTicket);

export default router;
