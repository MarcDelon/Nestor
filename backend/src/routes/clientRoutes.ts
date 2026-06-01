import { Router } from 'express';
import {
  getClientBillets, getClientColis, reserveTicket, createColisRequest,
  getClientProfile, updateClientProfile, redeemLoyaltyPoints,
  getClientNotifications, markClientNotificationRead, getClientVouchers,
  getAdminVouchers, createAdminVoucher, updateAdminVoucher, deleteAdminVoucher,
  contactSafeTrip
} from '../controllers/clientController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Route publique: Contact
router.post('/contact', contactSafeTrip);

// Routes Voyageur / Client — toutes protégées
router.get('/billets', requireAuth, getClientBillets);
router.get('/colis', requireAuth, getClientColis);
router.post('/reserver', requireAuth, reserveTicket);
router.get('/profile', requireAuth, getClientProfile);
router.put('/profile', requireAuth, updateClientProfile);

// Loyalty & vouchers
router.post('/loyalty/redeem', requireAuth, redeemLoyaltyPoints);
router.get('/vouchers', requireAuth, getClientVouchers);

// Notifications
router.get('/notifications', requireAuth, getClientNotifications);
router.put('/notifications/:id/read', requireAuth, markClientNotificationRead);

// Admin voucher CRUD
router.get('/admin/vouchers', requireAuth, requireRole('admin'), getAdminVouchers);
router.post('/admin/vouchers', requireAuth, requireRole('admin'), createAdminVoucher);
router.put('/admin/vouchers/:id', requireAuth, requireRole('admin'), updateAdminVoucher);
router.delete('/admin/vouchers/:id', requireAuth, requireRole('admin'), deleteAdminVoucher);

// Public — parcel shipping request from /agences page (visitors and clients)
router.post('/colis-request', createColisRequest);

export default router;
