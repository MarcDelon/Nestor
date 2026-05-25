import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'safetrip_super_secret_key_2026';

// Simulate a local memory database for fallback when Supabase is not configured
const simulatedUsers: Array<{
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: 'client' | 'agency' | 'admin';
}> = [
  {
    email: 'admin@safetrip.cm',
    passwordHash: bcrypt.hashSync('admin123', 10),
    fullName: 'Administrateur Principal',
    role: 'admin'
  },
  {
    email: 'finexs@safetrip.cm',
    passwordHash: bcrypt.hashSync('finexs123', 10),
    fullName: 'Finexs Agence',
    role: 'agency'
  }
];

// 1. SIGNUP / INSCRIPTION
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Champs requis manquants: email, password, fullName.' });
    }

    // Security Fix: All publicly registered users default to 'client' role.
    // Promotion to 'agency' or 'admin' must be performed manually in the database for security.
    const role: 'client' | 'agency' | 'admin' = 'client';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If Supabase is active
    if (supabase) {
      // Check if user already exists
      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle(); // Use maybeSingle to prevent throwing 406 on no rows

      if (existingUser) {
        return res.status(400).json({ error: 'Un utilisateur avec cette adresse email existe déjà.' });
      }

      // Insert new user
      const { data: newUser, error } = await (supabase as any)
        .from('users')
        .insert([{ email, password_hash: passwordHash, full_name: fullName, phone, role }])
        .select()
        .single();

      if (error || !newUser) {
        return res.status(500).json({ error: error?.message || 'Erreur lors de la création du compte.' });
      }

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'Utilisateur créé avec succès (Supabase).',
        token,
        user: { id: newUser.id, email: newUser.email, fullName: newUser.full_name, role: newUser.role }
      });
    } else {
      // Local fallback simulation
      const exists = simulatedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'Un utilisateur avec cette adresse email existe déjà (Simulation).' });
      }

      const newUser = { email, passwordHash, fullName, phone, role };
      simulatedUsers.push(newUser);

      const token = jwt.sign({ email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'Utilisateur créé avec succès (Simulation Locale).',
        token,
        user: { email: newUser.email, fullName: newUser.fullName, role: newUser.role }
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
};

// 2. LOGIN / CONNEXION
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Champs email et password requis.' });
    }

    const lowerEmail = email.toLowerCase();

    if (supabase) {
      const { data: user, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error || !user) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(200).json({
        message: 'Connexion réussie (Supabase).',
        token,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role }
      });
    } else {
      // Local fallback simulation
      const user = simulatedUsers.find(u => u.email.toLowerCase() === lowerEmail);
      if (!user) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect (Simulation).' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect (Simulation).' });
      }

      const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(200).json({
        message: 'Connexion réussie (Simulation Locale).',
        token,
        user: { email: user.email, fullName: user.fullName, role: user.role }
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
};
