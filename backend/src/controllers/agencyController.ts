import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// ============================================================
// SIMULATED LOCAL DATA (fallback when Supabase is not configured)
// ============================================================
const simAgencies = [
  { id: 1, name: 'Finexs Voyage', logo: '/images/finexs.png', certification: 'Partenaire Platine' },
  { id: 2, name: 'Buca Voyage', logo: '/images/bucavoyage.png', certification: 'Partenaire Or' },
  { id: 3, name: 'General Express', logo: '/images/General.png', certification: 'Partenaire Certifié' },
  { id: 4, name: 'Touristique Express', logo: '/images/Touristique.png', certification: 'Partenaire National' },
  { id: 5, name: 'Men Travel', logo: '/images/mentravel.png', certification: 'Partenaire Premium' }
];

let simBuses = [
  { id: 'BUS-01', agency_id: 1, plaque: 'LT-8812-G', bus_class: 'VIP', capacity: 30, occupied: 24, status: 'Disponible', amenities: ['wifi','ac','toilet','plug'] },
  { id: 'BUS-02', agency_id: 1, plaque: 'LT-4491-A', bus_class: 'Confort', capacity: 50, occupied: 42, status: 'En route', amenities: ['ac','plug'] },
  { id: 'BUS-03', agency_id: 1, plaque: 'LT-1102-K', bus_class: 'Classique', capacity: 70, occupied: 0, status: 'En maintenance', amenities: ['ac'] },
  { id: 'BUS-04', agency_id: 1, plaque: 'LT-9921-X', bus_class: 'Executive Class', capacity: 24, occupied: 20, status: 'Disponible', amenities: ['wifi','ac','toilet','catering','plug'] }
];

let simJourneyIdSeq = 9;
let simJourneys = [
  { id: 1, agency_id: 1, operator: 'Finexs Voyage VIP', logo: '/images/finexs.png', dep_time: '06:15', arr_time: '10:30', duration: '4h15', dep_station: 'Douala - Agence Finexs Douala', arr_station: 'Yaoundé - Agence Finexs Mvan', price: 6000, amenities: ['USB','AC','Sièges VIP'], amenity_keys: ['instant','reclining','plug','ac','ebillet','toilet'], warning: null, is_night: false },
  { id: 2, agency_id: 1, operator: 'Finexs Voyage VIP', logo: '/images/finexs.png', dep_time: '08:00', arr_time: '12:15', duration: '4h15', dep_station: 'Douala - Agence Finexs Douala', arr_station: 'Yaoundé - Agence Finexs Mvan', price: 4000, amenities: ['USB','AC','Sièges VIP'], amenity_keys: ['instant','reclining','plug','ac','ebillet'], warning: null, is_night: false },
  { id: 3, agency_id: 2, operator: 'Buca Voyage Confort', logo: '/images/bucavoyage.png', dep_time: '10:30', arr_time: '14:45', duration: '4h15', dep_station: 'Douala - Agence Buca Bessengue', arr_station: 'Yaoundé - Agence Buca Mvan', price: 6000, amenities: ['Prises','Sièges VIP'], amenity_keys: ['instant','reclining','plug','ac','ebillet','smoking'], warning: 'Bientôt complet', is_night: false },
  { id: 4, agency_id: 3, operator: 'General Express Confort', logo: '/images/General.png', dep_time: '13:00', arr_time: '17:15', duration: '4h15', dep_station: 'Douala - Bessengue', arr_station: 'Yaoundé - Mvan', price: 5000, amenities: ['AC','Prises'], amenity_keys: ['ac','ebillet','pets','instant'], warning: null, is_night: false },
  { id: 5, agency_id: 4, operator: 'Touristique Express VIP', logo: '/images/Touristique.png', dep_time: '15:00', arr_time: '19:15', duration: '4h15', dep_station: 'Douala - Agence Touristique Akwa', arr_station: 'Yaoundé - Agence Touristique Mvan', price: 5000, amenities: ['AC','Prises','Sièges VIP'], amenity_keys: ['instant','reclining','plug','ac','ebillet','toilet'], warning: null, is_night: false },
  { id: 6, agency_id: 5, operator: 'Men Travel Executive Class', logo: '/images/mentravel.png', dep_time: '16:30', arr_time: '20:45', duration: '4h15', dep_station: 'Douala - Carrefour Akwa', arr_station: 'Yaoundé - Mvan', price: 8000, amenities: ['Wi-Fi','AC','Restauration','Prises','Boisson offerte'], amenity_keys: ['instant','reclining','plug','ac','ebillet','toilet','wifi','catering','pmr'], warning: null, is_night: false },
  { id: 7, agency_id: 1, operator: 'Finexs Voyage Classique', logo: '/images/finexs.png', dep_time: '18:30', arr_time: '22:45', duration: '4h15', dep_station: 'Douala - Agence Finexs Douala', arr_station: 'Yaoundé - Agence Finexs Mvan', price: 3000, amenities: ['AC'], amenity_keys: ['instant','reclining','plug','ac','ebillet'], warning: null, is_night: false },
  { id: 8, agency_id: 2, operator: 'Buca Voyage Classique', logo: '/images/bucavoyage.png', dep_time: '19:00', arr_time: '23:15', duration: '4h15', dep_station: 'Douala - Bessengue', arr_station: 'Yaoundé - Mvan', price: 3000, amenities: ['AC'], amenity_keys: ['smoking','reclining','plug'], warning: null, is_night: true }
];

let simPassengerIdSeq = 100;
let simPassengers: { [journeyId: number]: any[] } = {
  1: [
    { id: 1, name: 'Marc Ndip', phone: '+237 699 01 22 33', seat: '1A (VIP)', status: 'Enregistré', luggage_count: 2, luggage_scanned: true },
    { id: 2, name: 'Syntyche Toukam', phone: '+237 677 44 55 66', seat: '2B (VIP)', status: 'Payé', luggage_count: 1, luggage_scanned: false },
    { id: 3, name: 'Jean-Pierre Talla', phone: '+237 655 77 88 99', seat: '4C', status: 'Payé', luggage_count: 3, luggage_scanned: true },
    { id: 4, name: 'Carine Bella', phone: '+237 691 12 34 56', seat: '5D', status: 'En attente', luggage_count: 0, luggage_scanned: false },
    { id: 5, name: 'Patrick Fotso', phone: '+237 670 98 76 54', seat: '8A', status: 'Payé', luggage_count: 2, luggage_scanned: false }
  ]
};

let simColis = [
  { id: 'BAG-2026-FX58-A', agency_id: 1, label: 'Sac de Voyage principal', type: 'Sac', weight: 15, color: 'Noir', status: 'À bord du bus', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 06:15', qr_ref: 'QR-FX58-A', fragile: false },
  { id: 'BAG-2026-FX58-B', agency_id: 1, label: 'Carton scellé (Alimentation)', type: 'Carton', weight: 8, color: 'Brun', status: 'Scanné en gare', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 06:15', qr_ref: 'QR-FX58-B', fragile: true },
  { id: 'BAG-2026-BV33-A', agency_id: 2, label: 'Valise cabine', type: 'Valise', weight: 12, color: 'Bordeaux', status: 'Livré', trip: 'Yaoundé → Bafoussam', trip_date: '18 Avril 2026 · 08:00', qr_ref: 'QR-BV33-A', fragile: false },
  { id: 'BAG-2026-GE21-A', agency_id: 3, label: 'Sac à dos randonnée', type: 'Sac à dos', weight: 5, color: 'Bleu', status: 'En attente de scan', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 18:30', qr_ref: 'QR-GE21-A', fragile: false }
];

let simMessages: { [threadId: string]: any[] } = {
  support: [
    { id: 1, sender: 'contact', text: "Bonjour, l'équipe d'assistance SafeTrip est disponible. Comment pouvons-nous vous aider aujourd'hui ?", time: '09:15' },
    { id: 2, sender: 'agency', text: 'Bonjour, nous aimerions certifier une nouvelle ligne de bus Douala-Kribi.', time: '09:30' },
    { id: 3, sender: 'contact', text: "Parfait ! Veuillez nous transmettre la plaque d'immatriculation et l'agrément ministériel du bus dans l'onglet Profil.", time: '09:32' }
  ],
  marc: [
    { id: 1, sender: 'contact', text: 'Bonjour Finexs, mon colis de référence BAG-2026-FX58-A est bien enregistré à bord ?', time: '11:05' },
    { id: 2, sender: 'agency', text: 'Bonjour Marc, oui ! Votre sac de voyage noir de 15 kg a été scanné avec succès et est à bord.', time: '11:20' }
  ],
  syntyche: [
    { id: 1, sender: 'contact', text: 'Merci pour le voyage VIP de ce matin, le bus était très confortable et le Wi-Fi super rapide !', time: '12:00' },
    { id: 2, sender: 'agency', text: 'Merci Syntyche ! Nous mettons tout en oeuvre pour vous offrir le meilleur service possible. Bon séjour !', time: '12:15' }
  ]
};

let simProfiles: { [agencyId: number]: any } = {
  1: { email: 'contact@finexs.cm', phone: '+237 699 90 90 90', address: 'Douala - Rue Akwa, Cameroun', description: 'Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.' }
};

// ============================================================
// Helper: resolve agency_id from agency name
// ============================================================
function resolveAgencyId(agencyName: string): number {
  const a = simAgencies.find(x => x.name.toLowerCase() === agencyName.toLowerCase());
  return a ? a.id : 1;
}

// ============================================================
// 1. GET /api/agency/agencies — List partner agencies
// ============================================================
export const getAgencies = async (_req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await (supabase as any).from('agencies').select('*').order('id');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 2. GET /api/agency/buses?agency=name — List buses
// ============================================================
export const getBuses = async (req: Request, res: Response) => {
  try {
    const agencyName = (req.query.agency as string) || '';
    if (supabase) {
      let q = (supabase as any).from('buses').select('*');
      if (agencyName) {
        const { data: ag } = await (supabase as any).from('agencies').select('id').ilike('name', `%${agencyName.split(' ')[0]}%`).maybeSingle();
        if (ag) q = q.eq('agency_id', ag.id);
      }
      const { data, error } = await q.order('id');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 3. POST /api/agency/buses — Add a bus
// ============================================================
export const addBus = async (req: Request, res: Response) => {
  try {
    const { id, plaque, bus_class, capacity, occupied, status, amenities, agency_name } = req.body;
    if (supabase) {
      const { data: ag } = await (supabase as any).from('agencies').select('id').ilike('name', `%${(agency_name || '').split(' ')[0]}%`).maybeSingle();
      const agency_id = ag?.id || 1;
      const { data, error } = await (supabase as any).from('buses').insert([{ id, agency_id, plaque, bus_class, capacity: capacity || 50, occupied: occupied || 0, status: status || 'Disponible', amenities: amenities || [] }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    return res.status(201).json({});
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 4. GET /api/agency/journeys?agency=name — List journeys
// ============================================================
export const getJourneys = async (req: Request, res: Response) => {
  try {
    const agencyName = (req.query.agency as string) || '';
    if (supabase) {
      let q = (supabase as any).from('journeys').select('*');
      if (agencyName) {
        q = q.ilike('operator', `%${agencyName.split(' ')[0]}%`);
      }
      const { data, error } = await q.order('id');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 5. GET /api/agency/journeys/all — List ALL journeys (no filter)
// ============================================================
export const getAllJourneys = async (_req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await (supabase as any).from('journeys').select('*').order('id');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 6. POST /api/agency/journeys — Create a new journey
// ============================================================
export const createJourney = async (req: Request, res: Response) => {
  try {
    const { operator, logo, dep_time, arr_time, duration, dep_station, arr_station, price, amenities, amenity_keys, warning, is_night, agency_name } = req.body;
    if (supabase) {
      const { data: ag } = await (supabase as any).from('agencies').select('id').ilike('name', `%${(agency_name || '').split(' ')[0]}%`).maybeSingle();
      const agency_id = ag?.id || 1;
      const { data, error } = await (supabase as any).from('journeys').insert([{
        agency_id, operator, logo, dep_time, arr_time, duration: duration || '4h15',
        dep_station, arr_station, price: price || 0,
        amenities: amenities || [], amenity_keys: amenity_keys || [],
        warning: warning || null, is_night: is_night || false
      }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    return res.status(201).json({});
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 7. GET /api/agency/passengers/:journeyId — Passengers for a journey
// ============================================================
export const getPassengers = async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.journeyId, 10);
    if (supabase) {
      const { data, error } = await (supabase as any).from('passengers').select('*').eq('journey_id', journeyId).order('id');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 8. PUT /api/agency/passengers/:journeyId/checkin/:passengerId
// ============================================================
export const checkinPassenger = async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.journeyId, 10);
    const passengerId = parseInt(req.params.passengerId, 10);
    if (supabase) {
      const { data, error } = await (supabase as any).from('passengers').update({ status: 'Enregistré' }).eq('id', passengerId).eq('journey_id', journeyId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json({ success: false });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 9. PUT /api/agency/passengers/:journeyId/scan/:passengerId
// ============================================================
export const scanPassengerLuggage = async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.journeyId, 10);
    const passengerId = parseInt(req.params.passengerId, 10);
    if (supabase) {
      const { data, error } = await (supabase as any).from('passengers').update({ luggage_scanned: true }).eq('id', passengerId).eq('journey_id', journeyId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json({ success: false });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 10. GET /api/agency/colis?agency=name — List colis
// ============================================================
export const getColis = async (req: Request, res: Response) => {
  try {
    const agencyName = (req.query.agency as string) || '';
    if (supabase) {
      let q = (supabase as any).from('colis').select('*, agencies(name)');
      if (agencyName) {
        const { data: ag } = await (supabase as any).from('agencies').select('id').ilike('name', `%${agencyName.split(' ')[0]}%`).maybeSingle();
        if (ag) q = q.eq('agency_id', ag.id);
      }
      const { data, error } = await q.order('id');
      if (error) return res.status(500).json({ error: error.message });
      // Flatten the agency name
      const formatted = (data || []).map((c: any) => ({
        ...c,
        agency: c.agencies?.name || '',
        agencies: undefined
      }));
      return res.json(formatted);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 11. PUT /api/agency/colis/:colisId/scan — Scan a colis
// ============================================================
export const scanColis = async (req: Request, res: Response) => {
  try {
    const { colisId } = req.params;
    const { status } = req.body;
    const newStatus = status || 'Scanné en gare';
    if (supabase) {
      const { data, error } = await (supabase as any).from('colis').update({ status: newStatus }).eq('id', colisId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json({ success: false });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 12. GET /api/agency/messages/:threadId?agency_id=1 — Get messages
// ============================================================
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const agencyId = parseInt(req.query.agency_id as string, 10) || 1;
    if (supabase) {
      const { data, error } = await (supabase as any).from('messages').select('*').eq('thread_id', threadId).eq('agency_id', agencyId).order('id');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 13. POST /api/agency/messages/:threadId — Send a message
// ============================================================
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { sender, text, time, agency_id } = req.body;
    const aId = agency_id || 1;
    if (supabase) {
      const { data, error } = await (supabase as any).from('messages').insert([{ agency_id: aId, thread_id: threadId, sender, text, time }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    return res.status(201).json({});
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 14. GET /api/agency/profile?agency_id=1 — Get agency profile
// ============================================================
export const getProfile = async (req: Request, res: Response) => {
  try {
    const agencyId = parseInt(req.query.agency_id as string, 10) || 1;
    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('agencies')
        .select('phone, address, description, photo, users(email)')
        .eq('id', agencyId)
        .maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      
      if (data) {
        return res.json({
          email: data.users?.email || '',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || '',
          photo: data.photo || ''
        });
      }
      return res.json({ email: '', phone: '', address: '', description: '', photo: '' });
    }
    return res.json({ email: '', phone: '', address: '', description: '', photo: '' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 15. PUT /api/agency/profile — Update agency profile
// ============================================================
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { agency_id, email, phone, address, description, photo } = req.body;
    const aId = agency_id || 1;
    if (supabase) {
      const { data: agency, error: agencyErr } = await (supabase as any)
        .from('agencies')
        .update({ phone, address, description, photo })
        .eq('id', aId)
        .select()
        .single();
      if (agencyErr) return res.status(500).json({ error: agencyErr.message });
      
      if (email && agency.user_id) {
        await (supabase as any)
          .from('users')
          .update({ email })
          .eq('id', agency.user_id);
      }
      
      return res.json({
        ...agency,
        email
      });
    }
    return res.json({});
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 16. GET /api/agency/all-messages?agency_id=1 — Get ALL threads for an agency
// ============================================================
export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const agencyId = parseInt(req.query.agency_id as string, 10) || 1;
    if (supabase) {
      const { data, error } = await (supabase as any).from('messages').select('*').eq('agency_id', agencyId).order('id');
      if (error) return res.status(500).json({ error: error.message });
      // Group by thread_id
      const grouped: { [threadId: string]: any[] } = {};
      (data || []).forEach((m: any) => {
        if (!grouped[m.thread_id]) grouped[m.thread_id] = [];
        grouped[m.thread_id].push(m);
      });
      return res.json(grouped);
    }
    return res.json({});
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};
