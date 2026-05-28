import { Router } from 'express';
import {
  getAgencies,
  getBuses,
  addBus,
  getJourneys,
  getAllJourneys,
  createJourney,
  getPassengers,
  checkinPassenger,
  scanPassengerLuggage,
  getColis,
  scanColis,
  getMessages,
  sendMessage,
  getProfile,
  updateProfile,
  getAllMessages,
  getOccupiedSeats,
  deleteJourney,
  markMessagesAsRead
} from '../controllers/agencyController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no auth required — used by passengers browsing)
router.get('/agencies', getAgencies);
router.get('/journeys/all', getAllJourneys);
router.get('/journeys', getJourneys);
router.get('/buses/all', getBuses);
router.get('/journeys/:journeyId/occupied-seats', getOccupiedSeats);

// Protected routes — agency authentication required
router.post('/buses', requireAuth, addBus);
router.get('/buses', requireAuth, getBuses);

router.post('/journeys', requireAuth, createJourney);
router.delete('/journeys/:id', requireAuth, deleteJourney);

router.get('/passengers/:journeyId', requireAuth, getPassengers);
router.put('/passengers/:journeyId/checkin/:passengerId', requireAuth, checkinPassenger);
router.put('/passengers/:journeyId/scan/:passengerId', requireAuth, scanPassengerLuggage);

router.get('/colis', requireAuth, getColis);
router.put('/colis/:colisId/scan', requireAuth, scanColis);

router.get('/all-messages', requireAuth, getAllMessages);
router.get('/messages/:threadId', requireAuth, getMessages);
router.post('/messages/:threadId', requireAuth, sendMessage);
router.put('/messages/:threadId/read', requireAuth, markMessagesAsRead);

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;
