import { Router } from 'express';
import { getClientBillets, getClientColis, reserveTicket } from '../controllers/clientController';

const router = Router();

// Routes Voyageur / Client
router.get('/billets', getClientBillets);
router.get('/colis', getClientColis);
router.post('/reserver', reserveTicket);

export default router;
