import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Mock data fallbacks for client dashboard
const mockBillets = [
  {
    id: "ST-2026-FX58",
    from: "Douala",
    to: "Yaoundé",
    company: "Finexs Voyage VIP",
    companyLogo: "/images/finexs.png",
    date: "25 Mai 2026",
    depTime: "06:15",
    arrTime: "10:30",
    duration: "4h15",
    seat: "2B (VIP)",
    luggageCount: 2,
    status: "Actif",
    price: 6000,
    depStation: "Agence Finexs Douala-Akwa",
    arrStation: "Agence Finexs Mvan Yaoundé",
    passenger: "Jean Client",
    phone: "+237 600 00 00 00",
    busClass: "VIP"
  },
  {
    id: "ST-2026-BV33",
    from: "Yaoundé",
    to: "Bafoussam",
    company: "Buca Voyage Confort",
    companyLogo: "/images/bucavoyage.png",
    date: "18 Avril 2026",
    depTime: "08:00",
    arrTime: "12:30",
    duration: "4h30",
    seat: "5A",
    luggageCount: 1,
    status: "Complété",
    price: 4500,
    depStation: "Agence Buca Mvan Yaoundé",
    arrStation: "Agence Buca Bafoussam Centre",
    passenger: "Jean Client",
    phone: "+237 600 00 00 00",
    busClass: "Confort"
  }
];

const mockColis = [
  {
    id: "BAG-2026-FX58-A",
    label: "Sac de Voyage principal",
    type: "Sac",
    weight: 15,
    color: "Noir",
    status: "À bord du bus",
    trip: "Douala → Yaoundé",
    tripDate: "25 Mai 2026 · 06:15",
    agency: "Finexs Voyage VIP",
    agencyLogo: "/images/finexs.png",
    qrRef: "QR-FX58-A",
    scannedAt: "25 Mai 2026 à 05:58",
    dimensions: "55 × 35 × 20 cm",
    fragile: false,
    notes: "Étiquette verte fixée"
  },
  {
    id: "BAG-2026-FX58-B",
    label: "Carton scellé (Restauration)",
    type: "Carton",
    weight: 8,
    color: "Brun",
    status: "À bord du bus",
    trip: "Douala → Yaoundé",
    tripDate: "25 Mai 2026 · 06:15",
    agency: "Finexs Voyage VIP",
    agencyLogo: "/images/finexs.png",
    qrRef: "QR-FX58-B",
    scannedAt: "25 Mai 2026 à 06:02",
    dimensions: "40 × 30 × 30 cm",
    fragile: true,
    notes: "FRAGILE — Contenu alimentaire"
  }
];

// 1. GET /api/client/billets?client_id=UUID — Fetch tickets for a traveler
export const getClientBillets = async (req: Request, res: Response) => {
  try {
    const clientId = req.query.client_id as string;
    if (!clientId) {
      return res.status(400).json({ error: 'Le paramètre client_id est requis.' });
    }

    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('passengers')
        .select('*, journeys(*, agencies(*))')
        .eq('client_id', clientId)
        .order('id', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const formatted = (data || []).map((p: any) => {
        const j = p.journeys || {};
        const agency = j.agencies || {};
        return {
          id: `ST-2026-FX${p.id}`,
          from: j.dep_station?.split(' - ')[0] || '',
          to: j.arr_station?.split(' - ')[0] || '',
          company: j.operator || 'Agence de Transport',
          companyLogo: j.logo || '/images/default_agency.png',
          date: new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          depTime: j.dep_time || '00:00',
          arrTime: j.arr_time || '00:00',
          duration: j.duration || '4h15',
          seat: p.seat || 'Libre',
          luggageCount: p.luggage_count || 0,
          status: p.status === 'Enregistré' ? 'Complété' : p.status === 'Payé' ? 'Actif' : 'Annulé',
          price: j.price || 0,
          depStation: j.dep_station || '',
          arrStation: j.arr_station || '',
          passenger: p.name,
          phone: p.phone,
          busClass: j.operator?.split(' ').slice(-1)[0] || 'Confort'
        };
      });

      return res.json(formatted);
    }

    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 2. GET /api/client/colis?client_id=UUID — Fetch packages for a traveler
export const getClientColis = async (req: Request, res: Response) => {
  try {
    const clientId = req.query.client_id as string;
    if (!clientId) {
      return res.status(400).json({ error: 'Le paramètre client_id est requis.' });
    }

    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('colis')
        .select('*, agencies(*)')
        .eq('client_id', clientId)
        .order('id', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const formatted = (data || []).map((c: any) => {
        const agency = c.agencies || {};
        return {
          id: c.id,
          label: c.label,
          type: c.type,
          weight: c.weight,
          color: c.color,
          status: c.status,
          trip: c.trip,
          tripDate: c.trip_date,
          agency: agency.name || 'SafeTrip Partenaire',
          agencyLogo: agency.logo || '/images/default_agency.png',
          qrRef: c.qr_ref,
          fragile: c.fragile,
          dimensions: "50 × 40 × 25 cm"
        };
      });

      return res.json(formatted);
    }

    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. POST /api/client/reserver — Book a ticket (simulated OM/Momo reference entry)
export const reserveTicket = async (req: Request, res: Response) => {
  try {
    const { journey_id, client_id, name, phone, seat, luggage_count, payment_reference } = req.body;

    if (!journey_id || !name || !seat) {
      return res.status(400).json({ error: 'Champs requis manquants: journey_id, name, seat.' });
    }

    const finalClientId = client_id || null;

    if (supabase) {
      // 1. Fetch journey details
      const { data: journey } = await (supabase as any)
        .from('journeys')
        .select('price, agency_id, bus_id, dep_station, arr_station, dep_time')
        .eq('id', journey_id)
        .maybeSingle();

      // 2. Add row to passengers
      const { data: passenger, error } = await (supabase as any)
        .from('passengers')
        .insert([{
          journey_id,
          client_id: finalClientId,
          name,
          phone,
          seat,
          status: 'Payé', // Once transaction ID is submitted, it is approved/paid in this USSD flow
          luggage_count: luggage_count || 0,
          luggage_scanned: false
        }])
        .select()
        .single();

      if (error || !passenger) {
        return res.status(500).json({ error: error?.message || 'Erreur lors de la réservation.' });
      }

      if (journey?.bus_id) {
        const { count } = await (supabase as any)
          .from('passengers')
          .select('id', { count: 'exact', head: true })
          .eq('journey_id', journey_id);

        await (supabase as any)
          .from('buses')
          .update({ occupied: count || 0 })
          .eq('id', journey.bus_id);
      }

      // Generate a mock colis if luggage_count > 0 to track in dashboard
      if (luggage_count && luggage_count > 0) {
        const agencyId = journey?.agency_id || null;
        const routeFrom = journey?.dep_station?.split(' - ')[0] || 'Départ';
        const routeTo = journey?.arr_station?.split(' - ')[0] || 'Destination';
        const tripDate = `${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · ${journey?.dep_time || '00:00'}`;
        const qrRef = `QR-ST${journey_id.toString().slice(-2)}-${passenger.id}`;
        await (supabase as any)
          .from('colis')
          .insert([{
            id: `BAG-2026-ST${journey_id.toString().slice(-2)}-${passenger.id}`,
            agency_id: agencyId,
            client_id: finalClientId,
            label: `Sac de Voyage principal de ${name}`,
            type: 'Sac',
            weight: 15.00,
            color: 'Noir',
            status: 'En attente de scan',
            trip: `${routeFrom} → ${routeTo}`,
            trip_date: tripDate,
            qr_ref: qrRef,
            fragile: false,
            sender_name: name,
            sender_phone: phone,
            receiver_name: name,
            receiver_phone: phone
          }]);
      }

      return res.status(201).json({
        message: 'Réservation validée avec succès !',
        ticketId: `ST-2026-FX${passenger.id}`,
        passenger
      });
    } else {
      // Simulated local fallback
      const passengerId = Math.floor(Math.random() * 1000) + 200;
      return res.status(201).json({
        message: 'Réservation validée avec succès (Simulation Locale) !',
        ticketId: `ST-2026-FX${passengerId}`,
        passenger: {
          id: passengerId,
          journey_id,
          client_id: finalClientId,
          name,
          phone,
          seat,
          status: 'Payé',
          luggage_count: luggage_count || 0
        }
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
