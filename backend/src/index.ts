import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import authRoutes from './routes/authRoutes';
import agencyRoutes from './routes/agencyRoutes';
import clientRoutes from './routes/clientRoutes';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuré pour autoriser l'envoi des cookies httpOnly depuis le frontend
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000';
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(o => o.trim());
const localDevRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2\d|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})(:3000)?$/;
const localTunnelRegex = /^https?:\/\/[a-z0-9-]+\.loca\.lt$/;
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || localDevRegex.test(origin) || localTunnelRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/payment', paymentRoutes);

// Endpoint de test de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Le serveur SafeTrip Backend est en pleine forme 🚀',
    supabaseConnected: supabase !== null,
    supabaseUrl: process.env.SUPABASE_URL || 'Non défini',
    time: new Date()
  });
});

// Lancement de l'écoute du serveur
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVEUR SAFETRIP ACTIF SUR http://localhost:${PORT}`);
  console.log(`====================================================`);
});
