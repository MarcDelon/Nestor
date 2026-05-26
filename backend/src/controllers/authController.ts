import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'safetrip_super_secret_key_2026';

// Simulated database fallback matching the new unified central users structure
const simulatedDatabase = {
  users: [
    { id: 'admin-uuid-1', email: 'admin@safetrip.cm', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { id: 'client-uuid-1', email: 'client@safetrip.cm', passwordHash: bcrypt.hashSync('client123', 10), role: 'client' },
    { id: 'agency-uuid-1', email: 'finexs@safetrip.cm', passwordHash: bcrypt.hashSync('123456', 10), role: 'agency' },
    { id: 'agency-uuid-2', email: 'buca@safetrip.cm', passwordHash: bcrypt.hashSync('123456', 10), role: 'agency' },
    { id: 'agency-uuid-3', email: 'general@safetrip.cm', passwordHash: bcrypt.hashSync('123456', 10), role: 'agency' },
    { id: 'agency-uuid-4', email: 'touristique@safetrip.cm', passwordHash: bcrypt.hashSync('123456', 10), role: 'agency' },
    { id: 'agency-uuid-5', email: 'men@safetrip.cm', passwordHash: bcrypt.hashSync('123456', 10), role: 'agency' },
  ],
  admins: [
    { id: 'admin-uuid-1', fullName: 'Administrateur Principal', photo: '/images/default_admin.png' }
  ],
  clients: [
    { id: 'client-uuid-1', fullName: 'Jean Client', phone: '+237 600 00 00 00', photo: '/images/default_avatar.png' }
  ],
  agencies: [
    {
      id: 1,
      user_id: 'agency-uuid-1',
      name: 'Finexs Voyage',
      logo: '/images/finexs.png',
      photo: '/images/finexs.png',
      certification: 'Partenaire Platine',
      phone: '+237 699 90 90 90',
      address: 'Douala - Rue Akwa, Cameroun',
      description: 'Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.'
    },
    {
      id: 2,
      user_id: 'agency-uuid-2',
      name: 'Buca Voyage',
      logo: '/images/bucavoyage.png',
      photo: '/images/bucavoyage.png',
      certification: 'Partenaire Or',
      phone: '+237 677 80 80 80',
      address: 'Douala - Bessengue, Cameroun',
      description: 'Agence de voyage confort et classique au service de la population camerounaise.'
    },
    {
      id: 3,
      user_id: 'agency-uuid-3',
      name: 'General Express',
      logo: '/images/General.png',
      photo: '/images/General.png',
      certification: 'Partenaire Certifié',
      phone: '+237 655 70 70 70',
      address: 'Douala - Bessengue, Cameroun',
      description: 'Transport interurbain accessible et fiable pour tous les camerounais.'
    },
    {
      id: 4,
      user_id: 'agency-uuid-4',
      name: 'Touristique Express',
      logo: '/images/Touristique.png',
      photo: '/images/Touristique.png',
      certification: 'Partenaire National',
      phone: '+237 691 60 60 60',
      address: 'Douala - Akwa, Cameroun',
      description: 'Leader du transport VIP touristique au Cameroun. Destinations : Kribi, Limbé, Bamenda.'
    },
    {
      id: 5,
      user_id: 'agency-uuid-5',
      name: 'Men Travel',
      logo: '/images/mentravel.png',
      photo: '/images/mentravel.png',
      certification: 'Partenaire Premium',
      phone: '+237 670 50 50 50',
      address: 'Douala - Carrefour Akwa, Cameroun',
      description: 'Transport Executive Class haut de gamme avec restauration à bord et confort incomparable.'
    }
  ]
};

// 1. INSCRIPTION / SIGNUP (Unifiée via la table centralisée 'users')
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, role } = req.body;
    const userRole = role || 'client'; // Par défaut, inscription client

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Champs requis manquants: email, password, fullName.' });
    }

    if (userRole !== 'client' && userRole !== 'agency') {
      return res.status(400).json({ error: 'Rôle invalide. Seuls les rôles "client" et "agency" sont autorisés pour l\'inscription.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const lowerEmail = email.toLowerCase();

    if (supabase) {
      // 1. Vérifier si l'utilisateur existe déjà dans 'users'
      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('email', lowerEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: 'Un utilisateur avec cette adresse email existe déjà.' });
      }

      // 2. Créer l'entrée dans 'users'
      const { data: newUser, error: userError } = await (supabase as any)
        .from('users')
        .insert([{ email: lowerEmail, password_hash: passwordHash, role: userRole }])
        .select()
        .single();

      if (userError || !newUser) {
        return res.status(500).json({ error: userError?.message || 'Erreur lors de la création de l\'utilisateur.' });
      }

      // 3. Créer l'entrée correspondante dans la sous-table
      if (userRole === 'client') {
        const { error: clientError } = await (supabase as any)
          .from('clients')
          .insert([{ id: newUser.id, full_name: fullName, phone }]);

        if (clientError) {
          // Rollback user
          await (supabase as any).from('users').delete().eq('id', newUser.id);
          return res.status(500).json({ error: clientError.message });
        }
      } else if (userRole === 'agency') {
        const { error: agencyError } = await (supabase as any)
          .from('agencies')
          .insert([{ user_id: newUser.id, name: fullName, phone }]);

        if (agencyError) {
          // Rollback user
          await (supabase as any).from('users').delete().eq('id', newUser.id);
          return res.status(500).json({ error: agencyError.message });
        }
      }

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: userRole }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'Utilisateur créé avec succès (Supabase).',
        token,
        user: { id: newUser.id, email: newUser.email, fullName, role: userRole, photo: '/images/default_avatar.png' }
      });
    } else {
      // Simulation locale
      const exists = simulatedDatabase.users.some(u => u.email.toLowerCase() === lowerEmail);
      if (exists) {
        return res.status(400).json({ error: 'Un utilisateur avec cette adresse email existe déjà (Simulation).' });
      }

      const newUserId = `user-uuid-${Date.now()}`;
      const newUser = { id: newUserId, email: lowerEmail, passwordHash, role: userRole };
      simulatedDatabase.users.push(newUser);

      if (userRole === 'client') {
        simulatedDatabase.clients.push({
          id: newUserId,
          fullName,
          phone,
          photo: '/images/default_avatar.png'
        });
      } else {
        simulatedDatabase.agencies.push({
          id: simulatedDatabase.agencies.length + 1,
          user_id: newUserId,
          name: fullName,
          logo: '/images/default_agency.png',
          photo: '/images/default_agency.png',
          certification: 'Partenaire Certifié',
          phone,
          address: '',
          description: ''
        });
      }

      const token = jwt.sign({ id: newUserId, email: lowerEmail, role: userRole }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'Utilisateur créé avec succès (Simulation Locale).',
        token,
        user: { id: newUserId, email: lowerEmail, fullName, role: userRole, photo: '/images/default_avatar.png' }
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
};

// 2. CONNEXION / LOGIN (Requête unique sur la table centralisée 'users')
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Champs email et password requis.' });
    }

    const lowerEmail = email.toLowerCase();

    if (supabase) {
      // 1. Rechercher l'utilisateur dans la table 'users'
      const { data: user } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('email', lowerEmail)
        .maybeSingle();

      if (!user) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      // 2. Valider le mot de passe
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      // 3. Charger le profil selon le rôle
      let fullName = '';
      let photo = '';
      let agencyId: number | undefined;

      if (user.role === 'client') {
        const { data: client } = await (supabase as any)
          .from('clients')
          .select('full_name, photo')
          .eq('id', user.id)
          .maybeSingle();
        fullName = client?.full_name || 'Voyageur';
        photo = client?.photo || '/images/default_avatar.png';
      } else if (user.role === 'agency') {
        const { data: agency } = await (supabase as any)
          .from('agencies')
          .select('id, name, logo, photo')
          .eq('user_id', user.id)
          .maybeSingle();
        fullName = agency?.name || 'Agence';
        photo = agency?.logo || agency?.photo || '/images/default_agency.png';
        agencyId = agency?.id;
      } else if (user.role === 'admin') {
        const { data: admin } = await (supabase as any)
          .from('admins')
          .select('full_name, photo')
          .eq('id', user.id)
          .maybeSingle();
        fullName = admin?.full_name || 'Administrateur';
        photo = admin?.photo || '/images/default_admin.png';
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, agencyId }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(200).json({
        message: `Connexion réussie en tant que ${user.role === 'admin' ? 'Administrateur' : user.role === 'agency' ? 'Agence' : 'Voyageur'}.`,
        token,
        user: { id: user.id, email: user.email, fullName, role: user.role, photo, agencyId }
      });
    } else {
      // Simulation locale
      const user = simulatedDatabase.users.find(u => u.email.toLowerCase() === lowerEmail);
      if (!user) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect (Simulation).' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect (Simulation).' });
      }

      let fullName = '';
      let photo = '';
      let agencyId: number | undefined;

      if (user.role === 'client') {
        const client = simulatedDatabase.clients.find(c => c.id === user.id);
        fullName = client?.fullName || 'Voyageur';
        photo = client?.photo || '/images/default_avatar.png';
      } else if (user.role === 'agency') {
        const agency = simulatedDatabase.agencies.find(a => a.user_id === user.id);
        fullName = agency?.name || 'Agence';
        photo = agency?.logo || '/images/default_agency.png';
        agencyId = agency?.id;
      } else if (user.role === 'admin') {
        const admin = simulatedDatabase.admins.find(a => a.id === user.id);
        fullName = admin?.fullName || 'Administrateur';
        photo = admin?.photo || '/images/default_admin.png';
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, agencyId }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(200).json({
        message: `Connexion réussie en tant que ${user.role === 'admin' ? 'Administrateur' : user.role === 'agency' ? 'Agence' : 'Voyageur'} (Simulation).`,
        token,
        user: { id: user.id, email: user.email, fullName, role: user.role, photo, agencyId }
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
};
