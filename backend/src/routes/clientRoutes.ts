import { Router } from 'express';
import { getClientBillets, getClientColis, reserveTicket, createColisRequest, getClientProfile, updateClientProfile, redeemLoyaltyPoints, getClientNotifications, markClientNotificationRead } from '../controllers/clientController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Routes Voyageur / Client — toutes protégées
router.get('/billets', requireAuth, getClientBillets);
router.get('/colis', requireAuth, getClientColis);
router.post('/reserver', requireAuth, reserveTicket);
router.get('/profile', requireAuth, getClientProfile);
router.put('/profile', requireAuth, updateClientProfile);

// Loyalty & vouchers
router.post('/loyalty/redeem', requireAuth, redeemLoyaltyPoints);

// Notifications
router.get('/notifications', requireAuth, getClientNotifications);
router.put('/notifications/:id/read', requireAuth, markClientNotificationRead);

// Public — parcel shipping request from /agences page (visitors and clients)
router.post('/colis-request', createColisRequest);

export default router;
