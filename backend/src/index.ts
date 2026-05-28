import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import authRoutes from './routes/authRoutes';
import agencyRoutes from './routes/agencyRoutes';
import clientRoutes from './routes/clientRoutes';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration des middlewares globaux
app.use(cors());
app.use(express.json());

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
