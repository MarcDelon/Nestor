import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { transporter } from '../utils/mailer';
import { emitNotification } from '../utils/socket';
import { sendSMS } from '../utils/sms';

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

// ============================================================
// 14. GET /api/agency/notifications?agency_id=1 — List agency notifications
// ============================================================
export const getAgencyNotifications = async (req: Request, res: Response) => {
  try {
    const agencyId = parseInt(req.query.agency_id as string, 10) || 1;
    if (!supabase) return res.json([]);
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 15. PUT /api/agency/notifications/:id/read?agency_id=1 — Mark as read
// ============================================================
export const markAgencyNotificationRead = async (req: Request, res: Response) => {
  try {
    const agencyId = parseInt(req.query.agency_id as string, 10) || 1;
    const { id } = req.params;
    if (!supabase) return res.json({ success: true });
    const { data, error } = await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', parseInt(id, 10))
      .eq('agency_id', agencyId)
      .select()
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || { success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

let simColis = [
  { id: 'BAG-2026-FX58-A', agency_id: 1, label: 'Sac de Voyage principal', type: 'Sac', weight: 15, color: 'Noir', status: 'À bord du bus', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 06:15', qr_ref: 'QR-FX58-A', fragile: false },
  { id: 'BAG-2026-FX58-B', agency_id: 1, label: 'Carton scellé (Alimentation)', type: 'Carton', weight: 8, color: 'Brun', status: 'Scanné en gare', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 06:15', qr_ref: 'QR-FX58-B', fragile: true },
  { id: 'BAG-2026-BV33-A', agency_id: 2, label: 'Valise cabine', type: 'Valise', weight: 12, color: 'Bordeaux', status: 'Livré', trip: 'Yaoundé → Bafoussam', trip_date: '18 Avril 2026 · 08:00', qr_ref: 'QR-BV33-A', fragile: false },
  { id: 'BAG-2026-GE21-A', agency_id: 3, label: 'Sac à dos randonnée', type: 'Sac à dos', weight: 5, color: 'Bleu', status: 'En attente de scan', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 18:30', qr_ref: 'QR-GE21-A', fragile: false }
];

let simMessages: { [threadId: string]: any[] } = {
  support: [
    { id: 1, sender: 'contact', text: "Bonjour, l'équipe d'assistance SafeTrip est disponible. Comment pouvons-nous vous aider aujourd'hui ?", time: '09:15', is_read: true },
    { id: 2, sender: 'agency', text: 'Bonjour, nous aimerions certifier une nouvelle ligne de bus Douala-Kribi.', time: '09:30', is_read: true },
    { id: 3, sender: 'contact', text: "Parfait ! Veuillez nous transmettre la plaque d'immatriculation et l'agrément ministériel du bus dans l'onglet Profil.", time: '09:32', is_read: true }
  ],
  marc: [
    { id: 1, sender: 'contact', text: 'Bonjour Finexs, mon colis de référence BAG-2026-FX58-A est bien enregistré à bord ?', time: '11:05', is_read: true },
    { id: 2, sender: 'agency', text: 'Bonjour Marc, oui ! Votre sac de voyage noir de 15 kg a été scanné avec succès et est à bord.', time: '11:20', is_read: true }
  ],
  syntyche: [
    { id: 1, sender: 'contact', text: 'Merci pour le voyage VIP de ce matin, le bus était très confortable et le Wi-Fi super rapide !', time: '12:00', is_read: true },
    { id: 2, sender: 'agency', text: 'Merci Syntyche ! Nous mettons tout en oeuvre pour vous offrir le meilleur service possible. Bon séjour !', time: '12:15', is_read: true }
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

      // Dynamically calculate active occupancy for each bus so past journeys reset to 0
      const now = new Date();
      const { data: journeysWithPassengers } = await (supabase as any)
        .from('journeys')
        .select('id, bus_id, dep_time, passengers(id, created_at)')
        .not('bus_id', 'is', null);

      const busOccupancyMap: Record<string, number> = {};
      if (journeysWithPassengers) {
        journeysWithPassengers.forEach((j: any) => {
          const busId = j.bus_id;
          if (!busId) return;
          
          const passengers = j.passengers || [];
          let activeCount = 0;
          
          passengers.forEach((p: any) => {
            const passengerDate = new Date(p.created_at);
            const depTimeParts = (j.dep_time || '00:00').split(':');
            const departureDateTime = new Date(
              passengerDate.getFullYear(),
              passengerDate.getMonth(),
              passengerDate.getDate(),
              parseInt(depTimeParts[0] || '0', 10),
              parseInt(depTimeParts[1] || '0', 10),
              0
            );
            
            if (departureDateTime >= now) {
              activeCount++;
            }
          });
          
          busOccupancyMap[busId] = (busOccupancyMap[busId] || 0) + activeCount;
        });
      }

      const enrichedBuses = (data || []).map((bus: any) => ({
        ...bus,
        occupied: busOccupancyMap[bus.id] || 0
      }));

      return res.json(enrichedBuses);
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
    const newBus = { id, agency_id: 1, plaque, bus_class, capacity: capacity || 50, occupied: occupied || 0, status: status || 'Disponible', amenities: amenities || [] };
    simBuses.push(newBus);
    return res.status(201).json(newBus);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 3b. PUT /api/agency/buses/:id — Update a bus
// ============================================================
export const updateBus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plaque, bus_class, capacity, status, amenities } = req.body;
    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('buses')
        .update({ plaque, bus_class, capacity, status, amenities })
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    const idx = simBuses.findIndex(b => b.id === id);
    if (idx !== -1) {
      simBuses[idx] = { ...simBuses[idx], plaque, bus_class, capacity, status, amenities };
      return res.json(simBuses[idx]);
    }
    return res.status(404).json({ error: 'Bus introuvable.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 3c. DELETE /api/agency/buses/:id — Delete a bus
// ============================================================
export const deleteBus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (supabase) {
      const { error } = await (supabase as any)
        .from('buses')
        .delete()
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, message: 'Bus supprimé avec succès.' });
    }
    const idx = simBuses.findIndex(b => b.id === id);
    if (idx !== -1) {
      simBuses.splice(idx, 1);
      return res.json({ success: true, message: 'Bus supprimé avec succès.' });
    }
    return res.status(404).json({ error: 'Bus introuvable.' });
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
// 5. GET /api/agency/journeys/all — List ALL journeys (optional sort query)
// ============================================================
export const getAllJourneys = async (req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await (supabase as any).from('journeys').select('*, buses(id, capacity, bus_class, occupied)').order('id');
      if (error) return res.status(500).json({ error: error.message });
      
      let results = [...(data || [])];
      const sortParam = (req.query.sort as string) || '';
      
      if (sortParam === 'vip') {
        results.sort((a, b) => {
          const isVipA = a.operator.toLowerCase().includes('vip') || a.operator.toLowerCase().includes('executive');
          const isVipB = b.operator.toLowerCase().includes('vip') || b.operator.toLowerCase().includes('executive');
          if (isVipA && !isVipB) return -1;
          if (!isVipA && isVipB) return 1;
          return a.id - b.id;
        });
      } else if (sortParam === 'classic') {
        results.sort((a, b) => {
          const isClsA = a.operator.toLowerCase().includes('classique');
          const isClsB = b.operator.toLowerCase().includes('classique');
          if (isClsA && !isClsB) return -1;
          if (!isClsA && isClsB) return 1;
          return a.id - b.id;
        });
      }
      
      return res.json(results);
    }
    return res.json([]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 6. POST /api/agency/journeys — Create a new journey
// ============================================================
export const createJourney = async (req: Request, res: Response) => {
  try {
    const { operator, logo, dep_time, arr_time, duration, dep_station, arr_station, price, amenities, amenity_keys, warning, is_night, agency_name, bus_id } = req.body;
    if (supabase) {
      const { data: ag } = await (supabase as any).from('agencies').select('id').ilike('name', `%${(agency_name || '').split(' ')[0]}%`).maybeSingle();
      const agency_id = ag?.id || 1;
      if (bus_id) {
        const { data: bus } = await (supabase as any)
          .from('buses')
          .select('id, agency_id')
          .eq('id', bus_id)
          .maybeSingle();

        if (!bus || bus.agency_id !== agency_id) {
          return res.status(400).json({ error: 'Bus introuvable ou non rattaché à cette agence.' });
        }
      }
      // Calculate the next available ID to bypass out-of-sync Postgres sequences from seed data
      const { data: maxJourney } = await (supabase as any)
        .from('journeys')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextId = (maxJourney?.id || 0) + 1;

      const { data, error } = await (supabase as any).from('journeys').insert([{
        id: nextId,
        agency_id, bus_id: bus_id || null, operator, logo, dep_time, arr_time, duration: duration || '4h15',
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
      const { data, error } = await (supabase as any)
        .from('passengers')
        .update({ luggage_scanned: true })
        .eq('id', passengerId)
        .eq('journey_id', journeyId)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });

      // Notify client: luggage scanned
      try {
        const { data: p } = await (supabase as any)
          .from('passengers')
          .select('client_id, name, seat, journey_id')
          .eq('id', passengerId)
          .maybeSingle();
        if (p?.client_id) {
          const { data: j } = await (supabase as any)
            .from('journeys')
            .select('dep_station, arr_station, dep_time')
            .eq('id', p.journey_id)
            .maybeSingle();
          const routeFrom = j?.dep_station?.split(' - ')[0] || 'Départ';
          const routeTo = j?.arr_station?.split(' - ')[0] || 'Destination';
          await (supabase as any)
            .from('notifications')
            .insert([{
              client_id: p.client_id,
              type: 'luggage_scanned',
              title: 'Bagage scanné à l\'embarquement',
              body: `${p.name} — Siège ${p.seat} — ${routeFrom} → ${routeTo}`,
              data: { passenger_id: passengerId, journey_id: p.journey_id, dep_time: j?.dep_time || null }
            }]);
          emitNotification('client', p.client_id, {
            type: 'luggage_scanned',
            title: 'Bagage scanné à l\'embarquement',
            body: `${p.name} — Siège ${p.seat} — ${routeFrom} → ${routeTo}`,
          });
        }
      } catch { /* ignore notification errors */ }
      return res.json(data);
    }
    return res.json({ success: false });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 10. POST /api/agency/tickets/scan — Validate a ticket QR token (single use)
// ============================================================
export const scanTicket = async (req: Request, res: Response) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token requis.' });
    if (supabase) {
      const { data: passenger, error } = await (supabase as any)
        .from('passengers')
        .select('id, name, phone, seat, ticket_scanned, ticket_scanned_at, journey_id, client_id')
        .eq('ticket_qr_token', token)
        .maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      if (!passenger) return res.status(404).json({ error: 'Billet introuvable pour ce token.' });

      if (passenger.ticket_scanned) {
        return res.status(409).json({
          status: 'already_used',
          scannedAt: passenger.ticket_scanned_at,
          passenger
        });
      }

      const { data: updated, error: updErr } = await (supabase as any)
        .from('passengers')
        .update({ ticket_scanned: true, ticket_scanned_at: new Date().toISOString() })
        .eq('id', passenger.id)
        .select()
        .single();
      if (updErr) return res.status(500).json({ error: updErr.message });

      // Notify client: ticket validated
      try {
        if (passenger.client_id) {
          const { data: j } = await (supabase as any)
            .from('journeys')
            .select('dep_station, arr_station, dep_time')
            .eq('id', passenger.journey_id)
            .maybeSingle();
          const routeFrom = j?.dep_station?.split(' - ')[0] || 'Départ';
          const routeTo = j?.arr_station?.split(' - ')[0] || 'Destination';
          await (supabase as any)
            .from('notifications')
            .insert([{
              client_id: passenger.client_id,
              type: 'ticket_validated',
              title: 'Billet validé à l\'embarquement',
              body: `${passenger.name} — Siège ${passenger.seat} — ${routeFrom} → ${routeTo}`,
              data: { passenger_id: passenger.id, journey_id: passenger.journey_id, dep_time: j?.dep_time || null }
            }]);
          emitNotification('client', passenger.client_id, {
            type: 'ticket_validated',
            title: 'Billet validé à l\'embarquement',
            body: `${passenger.name} — Siège ${passenger.seat} — ${routeFrom} → ${routeTo}`,
          });
        }
      } catch { /* ignore notification errors */ }
      return res.json({ status: 'validated', passenger: updated });
    }
    return res.json({ status: 'validated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ============================================================
// 10. GET /api/agency/colis?agency=name — List colis
// ============================================================
export const getColis = async (req: Request, res: Response) => {
  try {
    const agencyName = (req.query.agency as string) || '';
    if (supabase) {
      let q = (supabase as any).from('colis').select('*, agencies(name), clients(full_name, phone)');
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
        client_name: c.clients?.full_name || c.client_name || null,
        client_phone: c.clients?.phone || c.client_phone || null,
        agencies: undefined,
        clients: undefined
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

// In-memory fallback cache for read message IDs when database column is missing
const readMessagesCache = new Set<number>();

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
      const mapped = (data || []).map((m: any) => ({
        ...m,
        is_read: m.is_read !== undefined && m.is_read !== null ? m.is_read : readMessagesCache.has(m.id)
      }));
      return res.json(mapped);
    }
    const list = simMessages[threadId] || [];
    return res.json(list);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 13. POST /api/agency/messages/:threadId — Send a message
// ============================================================
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { sender, text, time, agency_id, reply_to_id, reply_to_text } = req.body;
    const aId = agency_id || 1;
    if (supabase) {
      let result = await (supabase as any).from('messages').insert([{ agency_id: aId, thread_id: threadId, sender, text, time, reply_to_id, reply_to_text, is_read: false }]).select().single();
      
      if (result.error && result.error.message.includes('is_read')) {
        console.warn('⚠️ is_read column missing in Supabase messages table, falling back...');
        result = await (supabase as any).from('messages').insert([{ agency_id: aId, thread_id: threadId, sender, text, time, reply_to_id, reply_to_text }]).select().single();
      }
      
      if (result.error) return res.status(500).json({ error: result.error.message });
      // Option A: Heuristic notification for traveler when agency replies
      try {
        if (sender === 'agency' && threadId && threadId !== 'support') {
          const { data: userRow } = await (supabase as any)
            .from('users')
            .select('id, email')
            .ilike('email', `${threadId}@%`)
            .maybeSingle();
          if (userRow?.id) {
            const notifBody = (typeof text === 'string' && text.length > 0) ? (text.length > 120 ? text.slice(0,117) + '…' : text) : 'Nouveau message reçu';
            await (supabase as any)
              .from('notifications')
              .insert([{
                client_id: userRow.id,
                type: 'agency_replied',
                title: "Réponse de l'agence",
                body: notifBody,
                data: { thread_id: threadId }
              }]);
            emitNotification('client', userRow.id, {
              type: 'agency_replied',
              title: "Réponse de l'agence",
              body: notifBody,
            });
          }
        }
      } catch { /* ignore notification errors */ }
      return res.status(201).json({
        ...result.data,
        is_read: result.data.is_read !== undefined ? result.data.is_read : false
      });
    }
    const list = simMessages[threadId] || [];
    const newMsg = { id: Date.now(), sender, text, time, reply_to_id: reply_to_id || null, reply_to_text: reply_to_text || null, is_read: false };
    simMessages[threadId] = [...list, newMsg];
    return res.status(201).json(newMsg);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 13b. PUT /api/agency/messages/:threadId/:messageId — Update a message
// ============================================================
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { threadId, messageId } = req.params as { threadId: string; messageId: string };
    const agencyId = parseInt((req.query.agency_id as string) || (req.body.agency_id as string) || '1', 10) || 1;
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texte du message requis.' });
    }

    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('messages')
        .update({ text })
        .eq('id', parseInt(messageId, 10))
        .eq('thread_id', threadId)
        .eq('agency_id', agencyId)
        .select()
        .maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Message introuvable.' });
      return res.json(data);
    }

    const list = simMessages[threadId] || [];
    const idx = list.findIndex((m: any) => m.id === Number(messageId));
    if (idx === -1) return res.status(404).json({ error: 'Message introuvable (simulation).' });
    list[idx] = { ...list[idx], text };
    simMessages[threadId] = list;
    return res.json(list[idx]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 13c. DELETE /api/agency/messages/:threadId/:messageId — Delete a message
// ============================================================
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { threadId, messageId } = req.params as { threadId: string; messageId: string };
    const agencyId = parseInt((req.query.agency_id as string) || '1', 10) || 1;

    if (supabase) {
      const { error } = await (supabase as any)
        .from('messages')
        .delete()
        .eq('id', parseInt(messageId, 10))
        .eq('thread_id', threadId)
        .eq('agency_id', agencyId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    const list = simMessages[threadId] || [];
    simMessages[threadId] = list.filter((m: any) => m.id !== Number(messageId));
    return res.json({ success: true });
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
        grouped[m.thread_id].push({
          ...m,
          is_read: m.is_read !== undefined && m.is_read !== null ? m.is_read : readMessagesCache.has(m.id)
        });
      });
      return res.json(grouped);
    }
    return res.json(simMessages);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// 17. GET /api/agency/journeys/:journeyId/occupied-seats — Get occupied seats
// ============================================================
export const getOccupiedSeats = async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.journeyId, 10);
    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('passengers')
        .select('seat')
        .eq('journey_id', journeyId);
      if (error) return res.status(500).json({ error: error.message });
      
      const seats = (data || []).map((p: any) => p.seat).filter(Boolean);
      return res.json(seats);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ============================================================
// 18. DELETE /api/agency/journeys/:id — Delete a journey
// ============================================================
export const deleteJourney = async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.id, 10);
    if (supabase) {
      // First, delete dependent passengers (if any)
      await (supabase as any).from('passengers').delete().eq('journey_id', journeyId);
      
      const { error } = await (supabase as any)
        .from('journeys')
        .delete()
        .eq('id', journeyId);
        
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, message: 'Trajet supprimé avec succès.' });
    }
    return res.json({ success: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ============================================================
// 19. PUT /api/agency/messages/:threadId/read — Mark messages as read
// ============================================================
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { role } = req.body;
    const agencyId = parseInt(req.query.agency_id as string, 10) || 1;
    const targetSender = role === 'agency' ? 'contact' : 'agency';
    
    if (supabase) {
      // 1. Fetch matching messages in thread and add them to our in-memory read messages cache
      const { data: threadMsgs } = await (supabase as any)
        .from('messages')
        .select('id')
        .eq('thread_id', threadId)
        .eq('agency_id', agencyId)
        .eq('sender', targetSender);
        
      if (threadMsgs && Array.isArray(threadMsgs)) {
        threadMsgs.forEach((m: any) => {
          readMessagesCache.add(m.id);
        });
      }

      // 2. Perform DB update (will succeed if the column has been added)
      const { data, error } = await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .eq('agency_id', agencyId)
        .eq('sender', targetSender)
        .eq('is_read', false)
        .select();
        
      if (error && error.message.includes('is_read')) {
        console.warn('⚠️ is_read column missing in Supabase, marked in memory cache instead.');
        return res.json({ success: true, message: 'Column missing, marked in memory cache instead.' });
      }
      
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, count: data?.length || 0 });
    }
    
    if (simMessages[threadId]) {
      simMessages[threadId] = simMessages[threadId].map((m: any) => {
        if (m.sender === targetSender) {
          return { ...m, is_read: true };
        }
        return m;
      });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ============================================================
// 20. POST /api/agency/quote-request — Submit a rental quote via WhatsApp
// ============================================================
export const submitQuoteRequest = async (req: Request, res: Response) => {
  try {
    const {
      busName, agency, capacity,
      clientName, clientPhone, clientEmail,
      departCity, destination, startDate, endDate,
      passengers, durationType, withDriver, extras, message
    } = req.body;

    const usageLabel: Record<string, string> = {
      jour: 'Location à la journée', trajet: 'Par trajet', semaine: 'À la semaine',
    };

    // Build WhatsApp message
    const waMsg = [
      `🚌 *DEMANDE DE LOCATION DE BUS — SAFETRIP*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Bus demandé :* ${busName} (${agency})`,
      `*Capacité :* ${capacity} places`,
      ``,
      `👤 *Client :* ${clientName}`,
      `📞 *Téléphone :* ${clientPhone}`,
      clientEmail ? `📧 *Email :* ${clientEmail}` : '',
      ``,
      `📍 *Départ :* ${departCity || '—'}`,
      `🏁 *Destination :* ${destination || '—'}`,
      startDate ? `📅 *Date départ :* ${startDate}` : '',
      endDate ? `📅 *Date retour :* ${endDate}` : '',
      `👥 *Passagers :* ${passengers || '—'}`,
      `⏱️ *Type de location :* ${usageLabel[durationType] || durationType}`,
      `🚗 *Chauffeur inclus :* ${withDriver ? 'Oui' : 'Non'}`,
      extras && extras.length > 0 ? `✨ *Options :* ${extras.join(', ')}` : '',
      message ? `\n📝 *Message :*\n${message}` : '',
    ].filter(Boolean).join('\n');

    // Save to service_requests table
    if (supabase) {
      try {
        await (supabase as any).from('service_requests').insert([{
          request_type: 'autre',
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail || null,
          description: `[LOCATION] ${busName} (${agency}) — ${departCity || '?'} → ${destination || '?'} — ${passengers || '?'} passagers — ${usageLabel[durationType] || durationType}${message ? '\n' + message : ''}`,
          preferred_date: startDate || null,
          origin_city: departCity || null,
          destination_city: destination || null,
          status: 'nouveau',
        }]);
      } catch (dbErr) {
        console.warn('⚠️ Could not save quote to service_requests:', dbErr);
      }
    }

    // Send WhatsApp message via CallMeBot API
    const cmbApiKey = process.env.CALLMEBOT_API_KEY;
    const cmbPhone = process.env.CALLMEBOT_PHONE_NUMBER || '237651529402';

    if (cmbApiKey) {
      try {
        const cmbUrl = `https://api.callmebot.com/whatsapp.php?phone=${cmbPhone}&text=${encodeURIComponent(waMsg)}&apikey=${cmbApiKey}`;
        const waRes = await fetch(cmbUrl);
        const waText = await waRes.text();
        
        if (!waRes.ok || waText.includes('Error')) {
          console.warn('⚠️ CallMeBot API error:', waText);
          return res.json({ success: true, whatsapp: false, fallbackUrl: `https://wa.me/${cmbPhone}?text=${encodeURIComponent(waMsg)}`, message: 'Devis sauvegardé. CallMeBot API error — lien de secours fourni.' });
        }
        console.log('✅ WhatsApp message sent successfully via CallMeBot');
        return res.json({ success: true, whatsapp: true, message: 'Devis envoyé via WhatsApp avec succès !' });
      } catch (waErr: any) {
        console.warn('⚠️ CallMeBot API call failed:', waErr.message);
        return res.json({ success: true, whatsapp: false, fallbackUrl: `https://wa.me/${cmbPhone}?text=${encodeURIComponent(waMsg)}`, message: 'Devis sauvegardé. Erreur API CallMeBot — lien de secours fourni.' });
      }
    }

    // No CallMeBot API configured — return fallback URL
    console.log('ℹ️ CallMeBot API not configured, returning fallback URL');
    return res.json({
      success: true,
      whatsapp: false,
      fallbackUrl: `https://wa.me/${cmbPhone}?text=${encodeURIComponent(waMsg)}`,
      message: 'Devis sauvegardé. Utilisez le lien WhatsApp pour envoyer manuellement.',
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ADMIN: POST /api/agency/agencies — Create a new agency (admin only)
// ============================================================
export const createAgency = async (req: Request, res: Response) => {
  try {
    const { name, logo, photo, certification, phone, address, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom de l\'agence est requis.' });

    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('agencies')
        .insert([{
          name,
          logo: logo || '/images/default_agency.png',
          photo: photo || logo || '/images/default_agency.png',
          certification: certification || 'Partenaire Certifié',
          phone: phone || null,
          address: address || null,
          description: description || null
        }])
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    return res.status(503).json({ error: 'Base de données non disponible.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// ADMIN: PUT /api/agency/agencies/:id — Update an agency (admin only)
// ============================================================
export const updateAgency = async (req: Request, res: Response) => {
  try {
    const agencyId = parseInt(req.params.id, 10);
    const { name, logo, photo, certification, phone, address, description } = req.body;

    if (supabase) {
      const updateFields: any = {};
      if (name !== undefined) updateFields.name = name;
      if (logo !== undefined) { updateFields.logo = logo; updateFields.photo = logo; }
      if (photo !== undefined) updateFields.photo = photo;
      if (certification !== undefined) updateFields.certification = certification;
      if (phone !== undefined) updateFields.phone = phone;
      if (address !== undefined) updateFields.address = address;
      if (description !== undefined) updateFields.description = description;

      const { data, error } = await (supabase as any)
        .from('agencies')
        .update(updateFields)
        .eq('id', agencyId)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Agence introuvable.' });
      return res.json(data);
    }
    return res.status(503).json({ error: 'Base de données non disponible.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// ADMIN: DELETE /api/agency/agencies/:id — Delete an agency (admin only)
// ============================================================
export const deleteAgency = async (req: Request, res: Response) => {
  try {
    const agencyId = parseInt(req.params.id, 10);

    if (supabase) {
      const { error } = await (supabase as any)
        .from('agencies')
        .delete()
        .eq('id', agencyId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, message: 'Agence supprimée avec succès.' });
    }
    return res.status(503).json({ error: 'Base de données non disponible.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ── NOTIFY DELIVERY ── Called when an agency scans a parcel QR at destination
export const notifyDelivery = async (req: Request, res: Response) => {
  try {
    const { colisRef, agenceName, senderName, senderPhone, recipientName, recipientPhone } = req.body;

    if (!colisRef) {
      return res.status(400).json({ error: 'colisRef requis.' });
    }

    // Update colis status in Supabase if available
    if (supabase) {
      try {
        const { data: updated } = await (supabase as any)
          .from('colis')
          .update({ status: 'Livré' })
          .or(`id.eq.${colisRef},qr_ref.eq.${colisRef}`)
          .select('id, client_id, qr_ref')
          .maybeSingle();
        if (updated?.client_id) {
          const deliveryBody = `Votre colis ${updated.id || colisRef} a été confirmé livré${agenceName ? ` par ${agenceName}` : ''}.`;
          await (supabase as any)
            .from('notifications')
            .insert([{
              client_id: updated.client_id,
              type: 'parcel_delivered',
              title: 'Colis livré',
              body: deliveryBody,
              data: { colis_id: updated.id || colisRef, qr_ref: updated.qr_ref || null }
            }]);
          emitNotification('client', updated.client_id, {
            type: 'parcel_delivered',
            title: 'Colis livré',
            body: deliveryBody,
          });
          // SMS notification for parcel delivery
          if (recipientPhone) {
            sendSMS(recipientPhone, `SafeTrip: Votre colis ${colisRef} a été livré${agenceName ? ` par ${agenceName}` : ''}. Merci d'utiliser SafeTrip !`).catch(() => {});
          }
        }
      } catch (e: any) {
        console.warn('Supabase colis update/notify failed:', e?.message || e);
      }
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.log('[notifyDelivery] SMTP not configured, skipping emails.');
      return res.json({ success: true, emailsSent: false, message: 'Statut mis à jour. Emails non configurés.' });
    }

    const buildHtml = (recipientDisplay: string, role: 'expéditeur' | 'destinataire') => `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre colis est arrivé !</title>
      </head>
      <body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f7fafc;margin:0;padding:0;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);">
          <div style="background:linear-gradient(135deg,#0A2F1D 0%,#00673C 100%);padding:28px 30px;text-align:center;">
            <h1 style="color:#FCD116;margin:0;font-size:26px;letter-spacing:-0.5px;">SafeTrip</h1>
            <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;font-weight:600;">Gestion de Colis & Courriers</p>
          </div>
          <div style="padding:36px 30px;">
            <div style="background:#eef8f3;border-radius:12px;padding:18px 20px;margin-bottom:24px;text-align:center;">
              <span style="font-size:42px;">📦</span>
              <h2 style="color:#0A2F1D;margin:8px 0 4px;font-size:20px;">Colis arrivé à destination !</h2>
              <p style="color:#718096;margin:0;font-size:14px;">En tant que <strong>${role}</strong>, vous êtes notifié(e).</p>
            </div>
            <p style="color:#2d3748;font-size:15px;line-height:1.7;">
              Bonjour <strong>${recipientDisplay}</strong>,<br/><br/>
              Nous vous informons que le colis <strong style="color:#00673C;">${colisRef}</strong> a bien été <strong>scanné et confirmé comme livré</strong> par l'agence <strong>${agenceName || 'SafeTrip'}</strong>.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr style="background:#f7fafc;">
                <td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Référence Colis</td>
                <td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${colisRef}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Expéditeur</td>
                <td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${senderName || 'N/A'} ${senderPhone ? `(${senderPhone})` : ''}</td>
              </tr>
              <tr style="background:#f7fafc;">
                <td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Destinataire</td>
                <td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${recipientName || 'N/A'} ${recipientPhone ? `(${recipientPhone})` : ''}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:0.5px;">Statut</td>
                <td style="padding:12px 16px;"><span style="background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:999px;font-weight:800;font-size:13px;">✅ Livré</span></td>
              </tr>
            </table>
            <p style="color:#718096;font-size:13px;line-height:1.6;">
              Pour toute question, n'hésitez pas à contacter directement l'agence <strong>${agenceName}</strong>.
            </p>
          </div>
          <div style="background:#f7fafc;padding:18px 30px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#a0aec0;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} SafeTrip Cameroun. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPromises: Promise<any>[] = [];

    // Note: we only have phone numbers, not emails, for sender/recipient from QR text.
    // So we send to the SMTP_USER (the agency email) as a delivery confirmation for now.
    // When recipient/sender email addresses are stored in DB, they can be added here.
    emailPromises.push(
      transporter.sendMail({
        from: `"SafeTrip Cameroun" <${smtpUser}>`,
        to: smtpUser,
        subject: `📦 Colis ${colisRef} — Confirmé comme Livré à destination`,
        html: buildHtml(`${recipientName || 'Destinataire'} / ${senderName || 'Expéditeur'}`, 'expéditeur'),
      })
    );

    await Promise.allSettled(emailPromises);

    return res.json({
      success: true,
      emailsSent: true,
      message: `Livraison confirmée. Notification envoyée pour le colis ${colisRef}.`,
    });

  } catch (err: any) {
    console.error('[notifyDelivery] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
