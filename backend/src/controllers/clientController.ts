import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import crypto from 'crypto';
import { transporter } from '../utils/mailer';
import { sendSMS } from '../utils/sms';
import { emitNotification } from '../utils/socket';

const LOYALTY_POINTS_PER_TRIP = 20;
const LOYALTY_FREE_TRIP_THRESHOLD = 1000;

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
        
        // Check if journey departure date/time has passed
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
        const isDeparturePassed = departureDateTime < new Date();
        
        // Determine status: if departure passed and still "Payé", mark as "Complété"
        let status = p.status === 'Enregistré' ? 'Complété' : p.status === 'Payé' ? 'Actif' : 'Annulé';
        if (isDeparturePassed && p.status === 'Payé') {
          status = 'Complété';
        }
        
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
          status: status,
          price: j.price || 0,
          depStation: j.dep_station || '',
          arrStation: j.arr_station || '',
          passenger: p.name,
          phone: p.phone,
          busClass: j.operator?.split(' ').slice(-1)[0] || 'Confort',
          qrToken: p.ticket_qr_token || null,
          ticketScanned: !!p.ticket_scanned,
          ticketScannedAt: p.ticket_scanned_at || null
        };
      });

      return res.json(formatted);
    }

    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 5. POST /api/client/loyalty/redeem — Redeem points for a voucher (requires auth)
export const redeemLoyaltyPoints = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Non authentifié.' });

    if (!supabase) return res.status(503).json({ error: 'Service indisponible.' });

    // Fetch current points
    const { data: lp, error: lpErr } = await (supabase as any)
      .from('loyalty_points')
      .select('points, total_earned, tier')
      .eq('client_id', user.id)
      .maybeSingle();
    if (lpErr) return res.status(500).json({ error: lpErr.message });

    const currentPoints = lp?.points || 0;
    if (currentPoints < LOYALTY_FREE_TRIP_THRESHOLD) {
      return res.status(400).json({ error: `Seuil non atteint: ${currentPoints}/${LOYALTY_FREE_TRIP_THRESHOLD} points.` });
    }

    // Idempotency: if an active assigned voucher exists, return it
    const { data: existing } = await (supabase as any)
      .from('vouchers')
      .select('id, code, status, expires_at, current_uses, max_uses')
      .eq('assigned_to', user.id)
      .eq('status', 'published')
      .gt('max_uses', 0)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
      return res.status(200).json({
        message: 'Bon existant encore valide.',
        voucher: existing
      });
    }

    // Generate unique voucher code
    const code = `STV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: voucher, error: vErr } = await (supabase as any)
      .from('vouchers')
      .insert([{ code, percentage: 100, max_uses: 1, current_uses: 0, status: 'published', assigned_to: user.id, expires_at: expiresAt.toISOString() }])
      .select()
      .single();
    if (vErr) return res.status(500).json({ error: vErr.message });

    // Deduct threshold points
    const newPoints = currentPoints - LOYALTY_FREE_TRIP_THRESHOLD;
    await (supabase as any)
      .from('loyalty_points')
      .upsert({ client_id: user.id, points: newPoints, total_earned: lp?.total_earned || currentPoints, tier: lp?.tier || 'Bronze' }, { onConflict: 'client_id' });

    return res.status(201).json({
      message: 'Points échangés contre un bon d\'achat.',
      voucher
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 6. GET /api/client/notifications — List client notifications
export const getClientNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Non authentifié.' });
    if (!supabase) return res.json([]);
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 7. PUT /api/client/notifications/:id/read — Mark as read
export const markClientNotificationRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Non authentifié.' });
    const { id } = req.params;
    if (!supabase) return res.json({ success: true });
    const { data, error } = await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', parseInt(id, 10))
      .eq('client_id', user.id)
      .select()
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || { success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// 8. GET /api/client/vouchers — List vouchers assigned to the authenticated traveler
export const getClientVouchers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Non authentifié.' });
    if (!supabase) return res.json([]);
    const { data, error } = await (supabase as any)
      .from('vouchers')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
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
          dimensions: "50 × 40 × 25 cm",
          senderName: c.sender_name || null,
          senderPhone: c.sender_phone || null,
          recipientName: c.receiver_name || c.recipient_name || null,
          recipientPhone: c.receiver_phone || c.recipient_phone || null,
        };
      });

      return res.json(formatted);
    }

    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. POST /api/client/colis-request — Submit a parcel-shipping request from /agences
//    Persists into the `colis` table so it appears in:
//      - the agency dashboard "Colis et courrier" tab
//      - the client dashboard "Colis" tab (if client_id is provided)
export const createColisRequest = async (req: Request, res: Response) => {
  try {
    const {
      agency_name,
      client_id,
      sender_name,
      sender_phone,
      sender_email,
      pickup_address,
      origin_city,
      recipient_name,
      recipient_phone,
      delivery_address,
      destination_city,
      parcel_type,
      parcel_weight,
      parcel_value,
      parcel_fragile,
      parcel_content,
      preferred_date,
      instructions,
    } = req.body || {};

    if (!agency_name || !sender_name || !sender_phone || !recipient_name || !recipient_phone || !parcel_content) {
      return res.status(400).json({ error: 'Champs requis manquants pour la demande de collecte de colis.' });
    }

    // Generate unique IDs
    const ts = Date.now();
    const colisId = `COLIS-${ts}`;
    const qrRef = `STR-${ts}`;

    const trip = `${origin_city || '—'} → ${destination_city || '—'}`;
    const tripDate = preferred_date || 'À planifier';
    const labelBase = (parcel_content || 'Colis').toString().trim();
    const label = labelBase.length > 60 ? `${labelBase.slice(0, 57)}…` : labelBase;
    const weightNum = Number(parcel_weight) || 0;
    const valueNum = Number(parcel_value) || 0;
    const fragile = !!parcel_fragile || parcel_type === 'fragile';

    if (supabase) {
      // Resolve agency_id by name (best-effort, partial match)
      let agencyId: number | null = null;
      try {
        const firstWord = String(agency_name).split(' ')[0];
        const { data: ag } = await (supabase as any)
          .from('agencies')
          .select('id')
          .ilike('name', `%${firstWord}%`)
          .maybeSingle();
        if (ag?.id) agencyId = ag.id;
      } catch { /* ignore — fallback to null */ }

      const insertRow: any = {
        id: colisId,
        agency_id: agencyId,
        client_id: client_id || null,
        label,
        type: 'Colis',
        weight: weightNum,
        color: 'Non spécifié',
        status: 'En attente de scan',
        trip,
        trip_date: tripDate,
        qr_ref: qrRef,
        fragile,
        sender_name,
        sender_phone,
        receiver_name: recipient_name,
        receiver_phone: recipient_phone,
      };

      const { data, error } = await (supabase as any)
        .from('colis')
        .insert([insertRow])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Create agency notification: new parcel request
      try {
        if (insertRow.agency_id) {
          await (supabase as any)
            .from('notifications')
            .insert([{
              agency_id: insertRow.agency_id,
              type: 'parcel_request_created',
              title: 'Nouvelle demande de collecte de colis',
              body: `${sender_name} → ${recipient_name} (${trip})`,
              data: {
                colis_id: data.id,
                qr_ref: data.qr_ref,
                client_id: client_id || null,
                trip,
                trip_date: tripDate
              }
            }]);
        }
      } catch { /* ignore notification errors */ }

      return res.status(201).json({
        message: 'Demande de collecte de colis enregistrée avec succès.',
        colis: data,
        meta: {
          sender_email: sender_email || null,
          pickup_address: pickup_address || null,
          delivery_address: delivery_address || null,
          parcel_value: valueNum,
          parcel_type: parcel_type || 'small',
          instructions: instructions || null,
        },
      });
    }

    // Local simulation fallback (no Supabase configured)
    return res.status(201).json({
      message: 'Demande enregistrée (simulation locale).',
      colis: {
        id: colisId,
        agency: agency_name,
        client_id: client_id || null,
        label,
        type: 'Colis',
        weight: weightNum,
        status: 'En attente de scan',
        trip,
        trip_date: tripDate,
        qr_ref: qrRef,
        fragile,
        sender_name,
        sender_phone,
        receiver_name: recipient_name,
        receiver_phone: recipient_phone,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 4. POST /api/client/reserver — Book a ticket (simulated OM/Momo reference entry)
export const reserveTicket = async (req: Request, res: Response) => {
  try {
    const { journey_id, client_id, name, phone, seat, luggage_count, payment_reference } = req.body;
    const userPayload = (req as any).user;

    if (!journey_id || !name || !seat) {
      return res.status(400).json({ error: 'Champs requis manquants: journey_id, name, seat.' });
    }

    const finalClientId = userPayload?.id || client_id || null;

    if (supabase) {
      // 1. Fetch journey details
      const { data: journey } = await (supabase as any)
        .from('journeys')
        .select('price, agency_id, bus_id, dep_station, arr_station, dep_time')
        .eq('id', journey_id)
        .maybeSingle();

      // 2. Add row to passengers
      const token = crypto.randomBytes(16).toString('hex');
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
          luggage_scanned: false,
          loyalty_points: LOYALTY_POINTS_PER_TRIP,
          ticket_qr_token: token
        }])
        .select()
        .single();

      if (error || !passenger) {
        return res.status(500).json({ error: error?.message || 'Erreur lors de la réservation.' });
      }

      if (finalClientId && phone) {
        await (supabase as any)
          .from('clients')
          .update({ phone })
          .eq('id', finalClientId);
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

      // Create agency notification: new booking
      try {
        const routeFrom = journey?.dep_station?.split(' - ')[0] || 'Départ';
        const routeTo = journey?.arr_station?.split(' - ')[0] || 'Destination';
        if (journey?.agency_id) {
          await (supabase as any)
            .from('notifications')
            .insert([{
              agency_id: journey.agency_id,
              type: 'booking_created',
              title: 'Nouvelle réservation de billet',
              body: `${name} — Siège ${seat} — ${routeFrom} → ${routeTo}`,
              data: {
                passenger_id: passenger.id,
                journey_id,
                client_id: finalClientId,
                seat,
                dep_time: journey?.dep_time || null
              }
            }]);
        }
      } catch { /* ignore notification errors */ }

      // ── Send booking confirmation email ──
      try {
        const routeFrom = journey?.dep_station?.split(' - ')[0] || 'Départ';
        const routeTo = journey?.arr_station?.split(' - ')[0] || 'Destination';
        const ticketId = `ST-2026-FX${passenger.id}`;
        const depTime = journey?.dep_time || '00:00';
        const price = journey?.price || 0;

        // Lookup user email
        let userEmail = '';
        if (finalClientId) {
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('email')
            .eq('id', finalClientId)
            .maybeSingle();
          userEmail = userData?.email || '';
        }

        if (userEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
          const emailHtml = `
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Confirmation de Réservation</title></head>
            <body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f7fafc;margin:0;padding:0;">
              <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);">
                <div style="background:linear-gradient(135deg,#0A2F1D 0%,#00673C 100%);padding:28px 30px;text-align:center;">
                  <h1 style="color:#FCD116;margin:0;font-size:26px;">SafeTrip</h1>
                  <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;font-weight:600;">Confirmation de Réservation</p>
                </div>
                <div style="padding:36px 30px;">
                  <div style="background:#eef8f3;border-radius:12px;padding:18px 20px;margin-bottom:24px;text-align:center;">
                    <span style="font-size:42px;">🎫</span>
                    <h2 style="color:#0A2F1D;margin:8px 0 4px;font-size:20px;">Réservation Confirmée !</h2>
                    <p style="color:#718096;margin:0;font-size:14px;">Votre billet a été validé avec succès.</p>
                  </div>
                  <p style="color:#2d3748;font-size:15px;line-height:1.7;">
                    Bonjour <strong>${name}</strong>,<br/><br/>
                    Votre réservation <strong style="color:#00673C;">${ticketId}</strong> a bien été enregistrée.
                  </p>
                  <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr style="background:#f7fafc;"><td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Trajet</td><td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${routeFrom} → ${routeTo}</td></tr>
                    <tr><td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Heure de départ</td><td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${depTime}</td></tr>
                    <tr style="background:#f7fafc;"><td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Siège</td><td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${seat}</td></tr>
                    <tr><td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Passager</td><td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${name}</td></tr>
                    <tr style="background:#f7fafc;"><td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Tarif</td><td style="padding:12px 16px;font-weight:700;color:#0A2F1D;border-bottom:1px solid #e2e8f0;">${price.toLocaleString()} FCFA</td></tr>
                    <tr><td style="padding:12px 16px;font-size:12px;font-weight:800;color:#718096;text-transform:uppercase;">Statut</td><td style="padding:12px 16px;"><span style="background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:999px;font-weight:800;font-size:13px;">Payé</span></td></tr>
                  </table>
                  <p style="color:#718096;font-size:13px;line-height:1.6;">
                    Présentez le QR code de votre billet numérique à l'embarquement. Bon voyage !
                  </p>
                </div>
                <div style="background:#f7fafc;padding:18px 30px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="color:#a0aec0;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} SafeTrip Cameroun. Tous droits réservés.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          transporter.sendMail({
            from: `"SafeTrip Cameroun" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `🎫 Réservation Confirmée — ${ticketId} — ${routeFrom} → ${routeTo}`,
            html: emailHtml,
          }).catch((err: any) => console.warn('[MAILER] Booking email failed:', err.message));
        }

        // ── Send SMS notification ──
        if (phone) {
          sendSMS(phone, `SafeTrip: Votre réservation ${ticketId} est confirmée. ${routeFrom} → ${routeTo} à ${depTime}. Siège ${seat}. Prix: ${price} FCFA. Présentez votre QR code à l'embarquement. Bon voyage !`).catch(() => {});
        }

        // ── Real-time notification via Socket.IO ──
        if (finalClientId) {
          emitNotification('client', finalClientId, {
            type: 'booking_created',
            title: 'Réservation confirmée',
            body: `${routeFrom} → ${routeTo} — Siège ${seat} — ${depTime}`,
          });
        }
      } catch (emailErr: any) {
        console.warn('[BOOKING] Post-booking notification error:', emailErr.message);
      }

      return res.status(201).json({
        message: 'Réservation validée avec succès !',
        ticketId: `ST-2026-FX${passenger.id}`,
        passenger,
        qrToken: token
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

const mockClientProfileDb: Record<string, any> = {
  'client-uuid-1': {
    full_name: 'Jean Client',
    phone: '+237 600 00 00 00',
    photo: '/images/default_avatar.png',
    address: 'Bastos, Yaoundé',
    city: 'Yaoundé',
    language_pref: 'fr'
  }
};

export const getClientProfile = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    if (!userPayload) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('full_name, phone, photo, address, city, language_pref')
        .eq('id', userPayload.id)
        .maybeSingle();

      let baseProfile: any = data;

      if (error) {
        // Fallback if columns don't exist — fetch only guaranteed columns
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          const { data: fallbackData, error: fallbackError } = await (supabase as any)
            .from('clients')
            .select('full_name, phone, photo')
            .eq('id', userPayload.id)
            .maybeSingle();
          if (fallbackError) return res.status(500).json({ error: fallbackError.message });
          baseProfile = fallbackData;
        } else {
          return res.status(500).json({ error: error.message });
        }
      }

      const clientProfile = {
        full_name: baseProfile?.full_name || 'Voyageur',
        phone: baseProfile?.phone || '',
        photo: baseProfile?.photo || '/images/default_avatar.png',
        address: baseProfile?.address || '',
        city: baseProfile?.city || '',
        language_pref: baseProfile?.language_pref || 'fr'
      };

      let loyaltyPoints = 0;
      let completedTrips = 0;
      try {
        const passengerRows: any[] = [];
        const seenPassengerIds = new Set<number>();

        const mergeRows = (rows?: any[]) => {
          if (!rows) return;
          rows.forEach((row: any) => {
            if (row && typeof row.id === 'number' && !seenPassengerIds.has(row.id)) {
              seenPassengerIds.add(row.id);
              passengerRows.push(row);
            }
          });
        };

        const { data: rowsByClientId, error: rowsByClientError } = await (supabase as any)
          .from('passengers')
          .select('id, status, loyalty_points')
          .eq('client_id', userPayload.id);
        if (!rowsByClientError) {
          mergeRows(rowsByClientId);
        }

        if (clientProfile.phone) {
          const normalizedPhone = clientProfile.phone.replace(/\s+/g, '');
          const { data: rowsByPhone, error: rowsByPhoneError } = await (supabase as any)
            .from('passengers')
            .select('id, status, loyalty_points, phone')
            .or(`phone.eq.${clientProfile.phone},phone.eq.${normalizedPhone}`);
          if (!rowsByPhoneError) {
            mergeRows(rowsByPhone);
          }
        }

        if (clientProfile.full_name) {
          const { data: rowsByName, error: rowsByNameError } = await (supabase as any)
            .from('passengers')
            .select('id, status, loyalty_points')
            .ilike('name', `%${clientProfile.full_name.trim()}%`);
          if (!rowsByNameError) {
            mergeRows(rowsByName);
          }
        }

        completedTrips = passengerRows.filter((p: any) => p.status === 'Enregistré').length;
        loyaltyPoints = passengerRows.reduce((sum: number, row: any) => {
          const fallback = LOYALTY_POINTS_PER_TRIP;
          return sum + (typeof row.loyalty_points === 'number' && row.loyalty_points > 0 ? row.loyalty_points : fallback);
        }, 0);
      } catch { /* ignore passenger fetch failure */ }

      const dbTier = loyaltyPoints >= 600 ? 'Gold' : loyaltyPoints >= 300 ? 'Silver' : 'Bronze';
      const loyaltyStatus = loyaltyPoints >= LOYALTY_FREE_TRIP_THRESHOLD
        ? 'Voyage offert'
        : loyaltyPoints >= 600
          ? 'Statut Or'
          : loyaltyPoints >= 300
            ? 'Statut Argent'
            : 'Statut Bronze';
      const freeTripEligible = loyaltyPoints >= LOYALTY_FREE_TRIP_THRESHOLD;
      try {
        await (supabase as any)
          .from('loyalty_points')
          .upsert({
            client_id: userPayload.id,
            points: loyaltyPoints,
            total_earned: loyaltyPoints,
            tier: dbTier
          }, { onConflict: 'client_id' });
      } catch { /* ignore loyalty persistence errors */ }

      return res.status(200).json({
        ...clientProfile,
        loyalty_points: loyaltyPoints,
        loyalty_status: loyaltyStatus,
        completed_trips: completedTrips,
        points_per_trip: LOYALTY_POINTS_PER_TRIP,
        free_trip_threshold: LOYALTY_FREE_TRIP_THRESHOLD,
        free_trip_eligible: freeTripEligible
      });
    } else {
      const profile = mockClientProfileDb[userPayload.id] || {
        full_name: 'Voyageur',
        phone: '',
        photo: '/images/default_avatar.png',
        address: '',
        city: '',
        language_pref: 'fr'
      };
      return res.status(200).json({
        ...profile,
        loyalty_points: profile.loyalty_points || 0,
        loyalty_status: 'Statut Bronze',
        completed_trips: profile.completed_trips || 0,
        points_per_trip: LOYALTY_POINTS_PER_TRIP,
        free_trip_threshold: LOYALTY_FREE_TRIP_THRESHOLD,
        free_trip_eligible: (profile.loyalty_points || 0) >= LOYALTY_FREE_TRIP_THRESHOLD
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ADMIN: GET /api/client/admin/vouchers — List all vouchers
// ============================================================
export const getAdminVouchers = async (req: Request, res: Response) => {
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await (supabase as any)
      .from('vouchers')
      .select('*')
      .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// ADMIN: POST /api/client/admin/vouchers — Create a voucher
// ============================================================
export const createAdminVoucher = async (req: Request, res: Response) => {
  try {
    const { code, percentage, max_uses, status, assigned_to, expires_at } = req.body;
    if (!code || code.length < 3) return res.status(400).json({ error: 'Le code doit contenir au moins 3 caractères.' });
    if (!percentage || percentage < 1 || percentage > 100) return res.status(400).json({ error: 'Pourcentage entre 1 et 100.' });
    if (!max_uses || max_uses < 1) return res.status(400).json({ error: 'Nombre d\'utilisations > 0.' });

    if (!supabase) return res.status(503).json({ error: 'Base de données non disponible.' });

    // Check uniqueness
    const { data: existing } = await (supabase as any)
      .from('vouchers')
      .select('id')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'Ce code existe déjà.' });

    const { data, error } = await (supabase as any)
      .from('vouchers')
      .insert([{
        code: code.toUpperCase(),
        percentage,
        max_uses,
        current_uses: 0,
        status: status || 'draft',
        assigned_to: assigned_to || null,
        expires_at: expires_at || null,
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// ADMIN: PUT /api/client/admin/vouchers/:id — Update a voucher
// ============================================================
export const updateAdminVoucher = async (req: Request, res: Response) => {
  try {
    const voucherId = parseInt(req.params.id, 10);
    const { code, percentage, max_uses, current_uses, status, assigned_to, expires_at } = req.body;

    if (!supabase) return res.status(503).json({ error: 'Base de données non disponible.' });

    const updateFields: any = {};
    if (code !== undefined) updateFields.code = code.toUpperCase();
    if (percentage !== undefined) updateFields.percentage = percentage;
    if (max_uses !== undefined) updateFields.max_uses = max_uses;
    if (current_uses !== undefined) updateFields.current_uses = current_uses;
    if (status !== undefined) updateFields.status = status;
    if (assigned_to !== undefined) updateFields.assigned_to = assigned_to;
    if (expires_at !== undefined) updateFields.expires_at = expires_at;

    const { data, error } = await (supabase as any)
      .from('vouchers')
      .update(updateFields)
      .eq('id', voucherId)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Bon introuvable.' });
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

// ============================================================
// ADMIN: DELETE /api/client/admin/vouchers/:id — Delete a voucher
// ============================================================
export const deleteAdminVoucher = async (req: Request, res: Response) => {
  try {
    const voucherId = parseInt(req.params.id, 10);
    if (!supabase) return res.status(503).json({ error: 'Base de données non disponible.' });

    const { error } = await (supabase as any)
      .from('vouchers')
      .delete()
      .eq('id', voucherId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, message: 'Bon supprimé avec succès.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
};

export const updateClientProfile = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    if (!userPayload) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { full_name, phone, photo, address, city, language_pref } = req.body;

    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('clients')
        .update({
          full_name,
          phone,
          photo,
          address,
          city,
          language_pref
        })
        .eq('id', userPayload.id)
        .select()
        .maybeSingle();

      if (error) {
        // If columns are missing in supabase, update only existing ones to avoid error
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          const { error: fallbackError } = await (supabase as any)
            .from('clients')
            .update({
              full_name,
              phone,
              photo
            })
            .eq('id', userPayload.id);
          if (fallbackError) return res.status(500).json({ error: fallbackError.message });
          return res.status(200).json({ message: 'Profil mis à jour (sans colonnes manquantes).', full_name, phone, photo });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Profil mis à jour avec succès.', profile: data });
    } else {
      mockClientProfileDb[userPayload.id] = {
        full_name: full_name || 'Voyageur',
        phone: phone || '',
        photo: photo || '/images/default_avatar.png',
        address: address || '',
        city: city || '',
        language_pref: language_pref || 'fr'
      };
      return res.status(200).json({ message: 'Profil mis à jour avec succès (Simulation).', profile: mockClientProfileDb[userPayload.id] });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
