/**
 * Script to seed the Supabase database with the schema tables and initial data.
 * Run: npx ts-node seed_db.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🚀 Début du seed de la base de données SafeTrip (Schéma Unifié)...\n');

  // Hachage des mots de passe
  const salt = bcrypt.genSaltSync(10);
  const adminPassHash = bcrypt.hashSync('admin123', salt);
  const clientPassHash = bcrypt.hashSync('client123', salt);
  const agencyPassHash = bcrypt.hashSync('123456', salt); // Default for all seed agencies

  // Clean old tables in correct dependency order
  console.log('🧹 Nettoyage des anciennes tables...');
  await supabase.from('messages').delete().gte('id', 0);
  await supabase.from('colis').delete().neq('id', 'dummy');
  await supabase.from('passengers').delete().gte('id', 0);
  await supabase.from('journeys').delete().gte('id', 0);
  await supabase.from('buses').delete().neq('id', 'dummy');
  await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('agencies').delete().gte('id', 0);
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  ✅ Nettoyage terminé.');

  // ============================================================
  // 1. SEED USERS (Central Table)
  // ============================================================
  console.log('👤 Insertion des utilisateurs dans la table centralisée (users)...');
  
  // UUIDs statiques pour conserver les liens de manière reproductible
  const adminUuid = 'a1e1d1ad-2026-4444-8888-000000000001';
  const clientUuid = 'c1c1c1c1-2026-4444-8888-000000000001';
  const finexsUserUuid = 'f1f1f1f1-2026-4444-8888-000000000001';
  const bucaUserUuid = 'b1b1b1b1-2026-4444-8888-000000000001';
  const generalUserUuid = 'e1e1e1e1-2026-4444-8888-000000000001';
  const touristiqueUserUuid = 'd1d1d1d1-2026-4444-8888-000000000001';
  const menUserUuid = 'a2a2a2a2-2026-4444-8888-000000000001';

  const { error: userErr } = await supabase.from('users').insert([
    { id: adminUuid, email: 'admin@safetrip.cm', password_hash: adminPassHash, role: 'admin' },
    { id: clientUuid, email: 'client@safetrip.cm', password_hash: clientPassHash, role: 'client' },
    { id: finexsUserUuid, email: 'finexs@safetrip.cm', password_hash: agencyPassHash, role: 'agency' },
    { id: bucaUserUuid, email: 'buca@safetrip.cm', password_hash: agencyPassHash, role: 'agency' },
    { id: generalUserUuid, email: 'general@safetrip.cm', password_hash: agencyPassHash, role: 'agency' },
    { id: touristiqueUserUuid, email: 'touristique@safetrip.cm', password_hash: agencyPassHash, role: 'agency' },
    { id: menUserUuid, email: 'men@safetrip.cm', password_hash: agencyPassHash, role: 'agency' }
  ]);

  if (userErr) {
    console.error('  ❌ Erreur users:', userErr.message);
    process.exit(1);
  }
  console.log('  ✅ Table users insérée.');

  // ============================================================
  // 2. SEED ADMINS & CLIENTS
  // ============================================================
  console.log('👑 Insertion de l\'administrateur et du client...');
  
  const { error: adminErr } = await supabase.from('admins').insert([
    { id: adminUuid, full_name: 'Administrateur Principal' }
  ]);
  if (adminErr) console.error('  ❌ Erreur admins:', adminErr.message);

  const { error: clientErr } = await supabase.from('clients').insert([
    { id: clientUuid, full_name: 'Jean Client', phone: '+237 600 00 00 00' }
  ]);
  if (clientErr) console.error('  ❌ Erreur clients:', clientErr.message);
  
  console.log('  ✅ Admins & Clients insérés.');

  // ============================================================
  // 3. AGENCIES
  // ============================================================
  console.log('🏢 Insertion des agences...');
  const { error: agErr } = await supabase.from('agencies').insert([
    { id: 1, user_id: finexsUserUuid, name: 'Finexs Voyage', logo: '/images/finexs.png', certification: 'Partenaire Platine', phone: '+237 699 90 90 90', address: 'Douala - Rue Akwa, Cameroun', description: 'Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.' },
    { id: 2, user_id: bucaUserUuid, name: 'Buca Voyage', logo: '/images/bucavoyage.png', certification: 'Partenaire Or', phone: '+237 677 80 80 80', address: 'Douala - Bessengue, Cameroun', description: 'Agence de voyage confort et classique au service de la population camerounaise.' },
    { id: 3, user_id: generalUserUuid, name: 'General Express', logo: '/images/General.png', certification: 'Partenaire Certifié', phone: '+237 655 70 70 70', address: 'Douala - Bessengue, Cameroun', description: 'Transport interurbain accessible et fiable pour tous les camerounais.' },
    { id: 4, user_id: touristiqueUserUuid, name: 'Touristique Express', logo: '/images/Touristique.png', certification: 'Partenaire National', phone: '+237 691 60 60 60', address: 'Douala - Akwa, Cameroun', description: 'Leader du transport VIP touristique au Cameroun. Destinations : Kribi, Limbé, Bamenda.' },
    { id: 5, user_id: menUserUuid, name: 'Men Travel', logo: '/images/mentravel.png', certification: 'Partenaire Premium', phone: '+237 670 50 50 50', address: 'Douala - Carrefour Akwa, Cameroun', description: 'Transport Executive Class haut de gamme avec restauration à bord et confort incomparable.' }
  ]);
  if (agErr) console.error('  ❌ Erreur agencies:', agErr.message);
  else console.log('  ✅ Agencies insérées');

  // ============================================================
  // 4. BUSES (16 par agence : 8 VIP + 8 Classique)
  // ============================================================
  console.log('🚌 Insertion des bus (16 par agence : 8 VIP + 8 Classique)...');

  const agencyConfigs = [
    { id: 1, platePrefix: 'LT', depStation: 'Douala - Agence Finexs Douala', arrStation: 'Yaoundé - Agence Finexs Mvan', name: 'Finexs Voyage', logo: '/images/finexs.png' },
    { id: 2, platePrefix: 'CE', depStation: 'Douala - Agence Buca Bessengue', arrStation: 'Yaoundé - Agence Buca Mvan', name: 'Buca Voyage', logo: '/images/bucavoyage.png' },
    { id: 3, platePrefix: 'LT', depStation: 'Douala - Bessengue', arrStation: 'Yaoundé - Mvan', name: 'General Express', logo: '/images/General.png' },
    { id: 4, platePrefix: 'AD', depStation: 'Douala - Agence Touristique Akwa', arrStation: 'Yaoundé - Agence Touristique Mvan', name: 'Touristique Express', logo: '/images/Touristique.png' },
    { id: 5, platePrefix: 'LT', depStation: 'Douala - Carrefour Akwa', arrStation: 'Yaoundé - Mvan', name: 'Men Travel', logo: '/images/mentravel.png' }
  ];

  // 8 créneaux horaires fixes pour chaque classe (VIP et Classique)
  const schedules = [
    { dep: '06:00', arr: '10:15', isNight: false },
    { dep: '09:00', arr: '13:15', isNight: false },
    { dep: '12:00', arr: '16:15', isNight: false },
    { dep: '15:00', arr: '19:15', isNight: false },
    { dep: '18:00', arr: '22:15', isNight: false },
    { dep: '21:00', arr: '01:15', isNight: true },
    { dep: '00:00', arr: '04:15', isNight: true },
    { dep: '03:00', arr: '07:15', isNight: true }
  ];

  const plateLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const allBuses: any[] = [];
  const allJourneys: any[] = [];
  let journeyId = 1;

  for (const agency of agencyConfigs) {
    // --- 8 bus VIP ---
    for (let i = 0; i < 8; i++) {
      const plateNum = ((agency.id * 1000 + (i + 1) * 111) % 9000 + 1000);
      const plateLetter = plateLetters[(agency.id * 7 + i * 3) % plateLetters.length];
      allBuses.push({
        id: `BUS-${agency.id}V${String(i + 1).padStart(2, '0')}`,
        agency_id: agency.id,
        plaque: `${agency.platePrefix}-${plateNum}-${plateLetter}`,
        bus_class: 'VIP',
        capacity: 30,
        occupied: Math.floor(15 + (agency.id * 3 + i * 5) % 14),
        status: i === 7 ? 'En maintenance' : (i % 3 === 1 ? 'En route' : 'Disponible'),
        amenities: ['wifi', 'ac', 'toilet', 'plug'],
        has_ac: true, has_toilet: true, has_wifi: true, has_catering: false
      });
      // Trajet VIP correspondant
      const sched = schedules[i];
      allJourneys.push({
        id: journeyId++,
        agency_id: agency.id,
        operator: `${agency.name} VIP`,
        logo: agency.logo,
        dep_time: sched.dep, arr_time: sched.arr, duration: '4h15',
        dep_station: agency.depStation, arr_station: agency.arrStation,
        price: 6000,
        amenities: ['Wi-Fi', 'AC', 'Sièges VIP'],
        amenity_keys: ['instant', 'reclining', 'plug', 'ac', 'ebillet', 'toilet', 'wifi'],
        warning: null, is_night: sched.isNight
      });
    }
    // --- 8 bus Classique ---
    for (let i = 0; i < 8; i++) {
      const plateNum = ((agency.id * 1000 + (i + 9) * 137) % 9000 + 1000);
      const plateLetter = plateLetters[(agency.id * 11 + i * 5) % plateLetters.length];
      allBuses.push({
        id: `BUS-${agency.id}C${String(i + 1).padStart(2, '0')}`,
        agency_id: agency.id,
        plaque: `${agency.platePrefix}-${plateNum}-${plateLetter}`,
        bus_class: 'Classique',
        capacity: 70,
        occupied: Math.floor(30 + (agency.id * 7 + i * 9) % 35),
        status: i === 6 ? 'En maintenance' : (i % 4 === 2 ? 'En route' : 'Disponible'),
        amenities: ['ac'],
        has_ac: true, has_toilet: false, has_wifi: false, has_catering: false
      });
      // Trajet Classique correspondant
      const sched = schedules[i];
      allJourneys.push({
        id: journeyId++,
        agency_id: agency.id,
        operator: `${agency.name} Classique`,
        logo: agency.logo,
        dep_time: sched.dep, arr_time: sched.arr, duration: '4h15',
        dep_station: agency.depStation, arr_station: agency.arrStation,
        price: 3000,
        amenities: ['AC'],
        amenity_keys: ['instant', 'ac', 'ebillet'],
        warning: null, is_night: sched.isNight
      });
    }
  }

  // Insertion de tous les bus
  const { error: busErr } = await supabase.from('buses').insert(allBuses);
  if (busErr) console.error('  ❌ Erreur buses:', busErr.message);
  else console.log(`  ✅ ${allBuses.length} buses insérées (${agencyConfigs.length} agences × 16 bus)`);

  // ============================================================
  // 5. JOURNEYS (16 par agence : 8 VIP + 8 Classique)
  // ============================================================
  console.log('🗺️ Insertion des trajets (horaires : 6h, 9h, 12h, 15h, 18h, 21h, 0h, 3h)...');
  const { error: jErr } = await supabase.from('journeys').insert(allJourneys);
  if (jErr) console.error('  ❌ Erreur journeys:', jErr.message);
  else console.log(`  ✅ ${allJourneys.length} trajets insérés (${agencyConfigs.length} agences × 16 horaires)`);

  // ============================================================
  // 6. PASSENGERS (lié en partie à notre compte client d'essai)
  // ============================================================
  console.log('👤 Insertion des passagers...');
  const passengersData = [
    // Journey 1
    { journey_id: 1, client_id: clientUuid, name: 'Jean Client', phone: '+237 600 00 00 00', seat: '1A (VIP)', status: 'Enregistré', luggage_count: 2, luggage_scanned: true },
    { journey_id: 1, name: 'Syntyche Toukam', phone: '+237 677 44 55 66', seat: '2B (VIP)', status: 'Payé', luggage_count: 1, luggage_scanned: false },
    { journey_id: 1, name: 'Jean-Pierre Talla', phone: '+237 655 77 88 99', seat: '4C', status: 'Payé', luggage_count: 3, luggage_scanned: true },
    { journey_id: 1, name: 'Carine Bella', phone: '+237 691 12 34 56', seat: '5D', status: 'En attente', luggage_count: 0, luggage_scanned: false },
    { journey_id: 1, name: 'Patrick Fotso', phone: '+237 670 98 76 54', seat: '8A', status: 'Payé', luggage_count: 2, luggage_scanned: false },
    // Journey 2
    { journey_id: 2, name: 'Syntyche Toukam', phone: '+237 677 44 55 66', seat: '2B (VIP)', status: 'Payé', luggage_count: 1, luggage_scanned: false },
    { journey_id: 2, name: 'Jean-Pierre Talla', phone: '+237 655 77 88 99', seat: '4C', status: 'Payé', luggage_count: 3, luggage_scanned: true },
    { journey_id: 2, name: 'Carine Bella', phone: '+237 691 12 34 56', seat: '5D', status: 'En attente', luggage_count: 0, luggage_scanned: false },
    { journey_id: 2, name: 'Patrick Fotso', phone: '+237 670 98 76 54', seat: '8A', status: 'Payé', luggage_count: 2, luggage_scanned: false },
    { journey_id: 2, name: 'Sandra Kamdem', phone: '+237 650 11 22 33', seat: '9B', status: 'Enregistré', luggage_count: 1, luggage_scanned: true },
    { journey_id: 2, name: 'Aboubakar Siddiki', phone: '+237 699 77 66 55', seat: '12C', status: 'Payé', luggage_count: 2, luggage_scanned: false }
  ];

  const { error: pErr } = await supabase.from('passengers').insert(passengersData);
  if (pErr) console.error('  ❌ Erreur passengers:', pErr.message);
  else console.log('  ✅ Passagers insérés');

  // ============================================================
  // 7. COLIS
  // ============================================================
  console.log('📦 Insertion des colis avec émetteurs et récepteurs...');
  const { error: cErr } = await supabase.from('colis').insert([
    { id: 'BAG-2026-FX58-A', agency_id: 1, client_id: clientUuid, label: 'Sac de Voyage principal', type: 'Sac', weight: 15, color: 'Noir', status: 'À bord du bus', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 06:15', qr_ref: 'QR-FX58-A', fragile: false, sender_name: 'Jean Client', sender_phone: '+237 600 00 00 00', receiver_name: 'Marie Talla', receiver_phone: '+237 677 11 22 33' },
    { id: 'BAG-2026-FX58-B', agency_id: 1, client_id: clientUuid, label: 'Carton scellé (Alimentation)', type: 'Carton', weight: 8, color: 'Brun', status: 'Scanné en gare', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 06:15', qr_ref: 'QR-FX58-B', fragile: true, sender_name: 'Jean Client', sender_phone: '+237 600 00 00 00', receiver_name: 'Franck Bella', receiver_phone: '+237 699 44 55 66' },
    { id: 'BAG-2026-BV33-A', agency_id: 2, label: 'Valise cabine', type: 'Valise', weight: 12, color: 'Bordeaux', status: 'Livré', trip: 'Yaoundé → Bafoussam', trip_date: '18 Avril 2026 · 08:00', qr_ref: 'QR-BV33-A', fragile: false, sender_name: 'Paul Kamdem', sender_phone: '+237 650 11 22 33', receiver_name: 'Alice Bella', receiver_phone: '+237 691 12 34 56' },
    { id: 'BAG-2026-GE21-A', agency_id: 3, label: 'Sac à dos randonnée', type: 'Sac à dos', weight: 5, color: 'Bleu', status: 'En attente de scan', trip: 'Douala → Yaoundé', trip_date: '25 Mai 2026 · 18:30', qr_ref: 'QR-GE21-A', fragile: false, sender_name: 'Steve Fotso', sender_phone: '+237 670 98 76 54', receiver_name: 'Jean Client', receiver_phone: '+237 600 00 00 00' }
  ]);
  if (cErr) console.error('  ❌ Erreur colis:', cErr.message);
  else console.log('  ✅ Colis insérés');

  // ============================================================
  // 8. MESSAGES
  // ============================================================
  console.log('💬 Insertion des messages...');
  const { error: mErr } = await supabase.from('messages').insert([
    { agency_id: 1, thread_id: 'support', sender: 'contact', text: "Bonjour, l'équipe d'assistance SafeTrip est disponible. Comment pouvons-nous vous aider aujourd'hui ?", time: '09:15' },
    { agency_id: 1, thread_id: 'support', sender: 'agency', text: 'Bonjour, nous aimerions certifier une nouvelle ligne de bus Douala-Kribi.', time: '09:30' },
    { agency_id: 1, thread_id: 'support', sender: 'contact', text: "Parfait ! Veuillez nous transmettre la plaque d'immatriculation et l'agrément ministériel du bus dans l'onglet Profil.", time: '09:32' },
    { agency_id: 1, thread_id: 'jean-client', sender: 'contact', text: 'Bonjour Finexs, mon colis de référence BAG-2026-FX58-A est bien enregistré à bord ?', time: '11:05' },
    { agency_id: 1, thread_id: 'jean-client', sender: 'agency', text: 'Bonjour Jean, oui ! Votre sac de voyage noir de 15 kg a été scanné avec succès et est à bord.', time: '11:20' }
  ]);
  if (mErr) console.error('  ❌ Erreur messages:', mErr.message);
  else console.log('  ✅ Messages insérés');

  console.log('\n====================================================');
  console.log('✅ SEED TERMINÉ AVEC SUCCÈS ! (Schéma Centralisé)');
  console.log('====================================================');
}

seedDatabase().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
