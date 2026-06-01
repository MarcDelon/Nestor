import { Router } from 'express';
import {
  getAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  getBuses,
  addBus,
  updateBus,
  deleteBus,
  getJourneys,
  getAllJourneys,
  createJourney,
  getPassengers,
  checkinPassenger,
  scanPassengerLuggage,
  getColis,
  scanColis,
  scanTicket,
  getMessages,
  sendMessage,
  getProfile,
  updateProfile,
  getAllMessages,
  getOccupiedSeats,
  deleteJourney,
  markMessagesAsRead,
  updateMessage,
  deleteMessage,
  submitQuoteRequest,
  notifyDelivery,
  getAgencyNotifications,
  markAgencyNotificationRead
} from '../controllers/agencyController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no auth required — used by passengers browsing)
router.get('/agencies', getAgencies);
router.get('/passengers/:journeyId', getPassengers);
// Admin-only agency CRUD
router.post('/agencies', requireAuth, requireRole('admin'), createAgency);
router.put('/agencies/:id', requireAuth, requireRole('admin'), updateAgency);
router.delete('/agencies/:id', requireAuth, requireRole('admin'), deleteAgency);
router.get('/journeys/all', getAllJourneys);
router.get('/journeys', getJourneys);
router.get('/buses/all', getBuses);
router.get('/journeys/:journeyId/occupied-seats', getOccupiedSeats);
router.post('/quote-request', submitQuoteRequest);

// Protected routes — agency authentication required
router.post('/buses', requireAuth, addBus);
router.put('/buses/:id', requireAuth, updateBus);
router.delete('/buses/:id', requireAuth, deleteBus);
router.get('/buses', requireAuth, getBuses);

router.post('/journeys', requireAuth, createJourney);
router.delete('/journeys/:id', requireAuth, deleteJourney);

router.get('/passengers/:journeyId', requireAuth, getPassengers);
router.put('/passengers/:journeyId/checkin/:passengerId', requireAuth, checkinPassenger);
router.put('/passengers/:journeyId/scan/:passengerId', requireAuth, scanPassengerLuggage);

// Colis & Bagages
router.get('/colis/all', getColis);
router.get('/colis', requireAuth, getColis);
router.put('/colis/:colisId/scan', requireAuth, scanColis);
router.post('/notify-delivery', requireAuth, notifyDelivery);
router.post('/tickets/scan', requireAuth, scanTicket);

// Notifications (Agence)
router.get('/notifications', requireAuth, getAgencyNotifications);
router.put('/notifications/:id/read', requireAuth, markAgencyNotificationRead);

// Messagerie Agence
router.get('/messages/all', getAllMessages);
router.get('/all-messages', getAllMessages);
router.get('/messages/:threadId', requireAuth, getMessages);
router.post('/messages/:threadId', requireAuth, sendMessage);
router.put('/messages/:threadId/read', requireAuth, markMessagesAsRead);
router.put('/messages/:threadId/:messageId', requireAuth, updateMessage);
router.delete('/messages/:threadId/:messageId', requireAuth, deleteMessage);

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;
