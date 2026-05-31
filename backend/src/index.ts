import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabase } from './config/supabase';
import { setIO } from './utils/socket';
import authRoutes from './routes/authRoutes';
import agencyRoutes from './routes/agencyRoutes';
import clientRoutes from './routes/clientRoutes';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuré pour autoriser l'envoi des cookies httpOnly depuis le frontend
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000';
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(o => o.trim());
const localDevRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2\d|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})(:3000)?$/;
const localTunnelRegex = /^https?:\/\/[a-z0-9-]+\.loca\.lt$/;

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || localDevRegex.test(origin) || localTunnelRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// ── Socket.IO ──
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || localDevRegex.test(origin) || localTunnelRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

setIO(io);

const JWT_SECRET = process.env.JWT_SECRET || 'safetrip_jwt_secret_key_2026';

io.use((socket, next) => {
  // Auth via cookie or query token
  const rawCookies = socket.handshake.headers.cookie || '';
  let token = '';
  const match = rawCookies.match(/token=([^;]+)/);
  if (match) token = match[1];
  if (!token) token = socket.handshake.auth?.token || '';

  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (socket as any).user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  if (!user) return socket.disconnect();

  // Join a room based on user role & id
  if (user.role === 'client') {
    socket.join(`client_${user.id}`);
  } else if (user.role === 'agency') {
    socket.join(`agency_${user.agencyId || user.id}`);
  } else if (user.role === 'admin') {
    socket.join('admin');
  }

  socket.on('mark_read', async (data: { notificationId: number }) => {
    if (!supabase || !data.notificationId) return;
    try {
      if (user.role === 'client') {
        await (supabase as any).from('notifications').update({ read: true }).eq('id', data.notificationId).eq('client_id', user.id);
      } else if (user.role === 'agency') {
        await (supabase as any).from('notifications').update({ read: true }).eq('id', data.notificationId).eq('agency_id', user.agencyId || user.id);
      }
    } catch { /* ignore */ }
  });

  socket.on('disconnect', () => {});
});

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/payment', paymentRoutes);

// Endpoint de test de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Le serveur SafeTrip Backend est en pleine forme',
    supabaseConnected: supabase !== null,
    supabaseUrl: process.env.SUPABASE_URL || 'Non défini',
    socketIO: true,
    time: new Date()
  });
});

// Lancement de l'écoute du serveur (http server pour Socket.IO)
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`SERVEUR SAFETRIP ACTIF SUR http://localhost:${PORT}`);
  console.log(`Socket.IO actif pour notifications temps réel`);
  console.log(`====================================================`);
});
