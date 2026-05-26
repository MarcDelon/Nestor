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
  getAllMessages
} from '../controllers/agencyController';

const router = Router();

// Agencies
router.get('/agencies', getAgencies);

// Buses
router.get('/buses', getBuses);
router.post('/buses', addBus);

// Journeys
router.get('/journeys', getJourneys);
router.get('/journeys/all', getAllJourneys);
router.post('/journeys', createJourney);

// Passengers
router.get('/passengers/:journeyId', getPassengers);
router.put('/passengers/:journeyId/checkin/:passengerId', checkinPassenger);
router.put('/passengers/:journeyId/scan/:passengerId', scanPassengerLuggage);

// Colis / Baggage
router.get('/colis', getColis);
router.put('/colis/:colisId/scan', scanColis);

// Messages
router.get('/all-messages', getAllMessages);
router.get('/messages/:threadId', getMessages);
router.post('/messages/:threadId', sendMessage);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
