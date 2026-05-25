import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration des middlewares globaux
app.use(cors());
app.use(express.json());

// Routes de l'API
app.use('/api/auth', authRoutes);

// Endpoint de test de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Le serveur SafeTrip Backend est en pleine forme 🚀',
    time: new Date()
  });
});

// Lancement de l'écoute du serveur
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVEUR SAFETRIP ACTIF SUR http://localhost:${PORT}`);
  console.log(`====================================================`);
});
