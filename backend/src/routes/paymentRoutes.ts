import { Router } from 'express';
import { initiateCollect, checkPaymentStatus } from '../controllers/paymentController';

const router = Router();

// POST /api/payment/collect — Initiate a Campay USSD push payment
router.post('/collect', initiateCollect);

// GET /api/payment/status/:reference — Check a Campay transaction status
router.get('/status/:reference', checkPaymentStatus);

export default router;
