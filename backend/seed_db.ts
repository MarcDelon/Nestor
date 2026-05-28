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
  console.log('🚀 Début du seed de la base de données SafeTrip (Cohérent & Diversifié)...\n');

  // Hachage des mots de passe
  const salt = bcrypt.genSaltSync(10);
  const adminPassHash = bcrypt.hashSync('admin123', salt);
  const agencyPassHash = bcrypt.hashSync('123456', salt); // Default for all seed agencies

  // Clean old tables in correct dependency order
  console.log('🧹 Nettoyage des anciennes tables...');
  await supabase.from('messages').delete().neq('id', -1);
  await supabase.from('colis').delete().neq('id', 'dummy');
  await supabase.from('passengers').delete().neq('id', -1);
  await supabase.from('journeys').delete().neq('id', -1);
  await supabase.from('buses').delete().neq('id', 'dummy');
  await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('agencies').delete().neq('id', -1);
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  ✅ Nettoyage terminé.');

  // ============================================================
  // 1. SEED USERS (Minimal for Agencies & Admin only - NO Client users added)
  // ============================================================
  console.log('👤 Insertion des utilisateurs techniques indispensables (users)...');
  
  const adminUuid = 'a1e1d1ad-2026-4444-8888-000000000001';
  const finexsUserUuid = 'f1f1f1f1-2026-4444-8888-000000000001';
  const bucaUserUuid = 'b1b1b1b1-2026-4444-8888-000000000001';
  const generalUserUuid = 'e1e1e1e1-2026-4444-8888-000000000001';
  const touristiqueUserUuid = 'd1d1d1d1-2026-4444-8888-000000000001';
  const menUserUuid = 'a2a2a2a2-2026-4444-8888-000000000001';

  const { error: userErr } = await supabase.from('users').insert([
    { id: adminUuid, email: 'admin@safetrip.cm', password_hash: adminPassHash, role: 'admin' },
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

  // Seed Admin profile
  const { error: adminErr } = await supabase.from('admins').insert([
    { id: adminUuid, full_name: 'Administrateur Principal' }
  ]);
  if (adminErr) console.error('  ❌ Erreur admins:', adminErr.message);
  
  // ============================================================
  // 2. AGENCIES
  // ============================================================
  console.log('🏢 Insertion des agences...');
  const { error: agErr } = await supabase.from('agencies').insert([
    { id: 1, user_id: finexsUserUuid, name: 'Finexs Voyage', logo: '/images/finexs.png', certification: 'Partenaire Platine', phone: '+237 699 90 90 90', address: 'Douala - Rue Akwa, Cameroun', description: 'Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.' },
    { id: 2, user_id: bucaUserUuid, name: 'Buca Voyage', logo: '/images/bucavoyage.png', certification: 'Partenaire Or', phone: '+237 677 80 80 80', address: 'Douala - Bessengue, Cameroun', description: 'Agence de voyage confort et classique au service de la population camerounaise.' },
    { id: 3, user_id: generalUserUuid, name: 'General Express', logo: '/images/General.png', certification: 'Partenaire Certifié', phone: '+237 655 70 70 70', address: 'Douala - Bessengue, Cameroun', description: 'Transport interurbain accessible et fiable pour tous les camerounais.' },
    { id: 4, user_id: touristiqueUserUuid, name: 'Touristique Express', logo: '/images/Touristique.png', certification: 'Partenaire National', phone: '+237 691 60 60 60', address: 'Douala - Akwa, Cameroun', description: 'Leader du transport VIP touristique au Cameroun. Destinations : Kribi, Limbé, Bamenda.' },
    { id: 5, user_id: menUserUuid, name: 'Men Travel', logo: '/images/mentravel.png', certification: 'Partenaire Premium', phone: '+237 670 50 50 50', address: 'Douala - Carrefour Akwa, Cameroun', description: 'Transport Executive Class haut de gamme avec restauration à bord et confort incomparable.' }
  ]);

  if (agErr) {
    console.error('  ❌ Erreur agencies:', agErr.message);
    process.exit(1);
  }
  console.log('  ✅ Agencies insérées.');

  // ============================================================
  // 3. BUSES & JOURNEYS GENERATION
  // ============================================================
  console.log('🚌 Génération des bus et des trajets...');

  const agencyConfigs = [
    { id: 1, name: 'Finexs Voyage', logo: '/images/finexs.png', platePrefix: 'LT', isShiftedTime: true, depStation: 'Douala - Agence Finexs Douala', arrStation: 'Yaoundé - Agence Finexs Mvan' },
    { id: 2, name: 'Buca Voyage', logo: '/images/bucavoyage.png', platePrefix: 'CE', isShiftedTime: false, depStation: 'Douala - Agence Buca Bessengue', arrStation: 'Yaoundé - Agence Buca Mvan' },
    { id: 3, name: 'General Express', logo: '/images/General.png', platePrefix: 'LT', isShiftedTime: false, depStation: 'Douala - Bessengue', arrStation: 'Yaoundé - Mvan' },
    { id: 4, name: 'Touristique Express', logo: '/images/Touristique.png', platePrefix: 'AD', isShiftedTime: false, depStation: 'Douala - Agence Touristique Akwa', arrStation: 'Yaoundé - Agence Touristique Mvan' },
    { id: 5, name: 'Men Travel', logo: '/images/mentravel.png', platePrefix: 'LT', isShiftedTime: true, depStation: 'Douala - Carrefour Akwa', arrStation: 'Yaoundé - Mvan' }
  ];

  const standardHours = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00'];
  const shiftedHours = ['06:30', '09:30', '12:30', '15:30', '18:30', '21:30', '00:30', '03:30'];

  const allBuses: any[] = [];
  const allJourneys: any[] = [];
  let journeyId = 1;

  for (const agency of agencyConfigs) {
    const hours = agency.isShiftedTime ? shiftedHours : standardHours;

    // A. 16 BUSES & JOURNEYS FOR THE TRANSITS (8 CLASSIC + 8 VIP)
    // --- 8 VIP Buses & Journeys ---
    for (let i = 0; i < 8; i++) {
      const busId = `BUS-${agency.id}-VIP-${i+1}`;
      const plaque = `${agency.platePrefix}-${1000 + agency.id*100 + i*10}-A`;
      
      // Diverse amenities for VIP
      const amenities = ['ac', 'wifi', 'toilet', 'usb', 'tv', 'reclining'];
      if (i % 2 === 0) amenities.push('catering'); // Catering on even VIP journeys
      if (i % 3 === 0) amenities.push('leather'); // Premium leather seats on some VIP journeys

      allBuses.push({
        id: busId,
        agency_id: agency.id,
        plaque,
        bus_class: i % 4 === 0 ? 'Executive Class' : 'VIP',
        capacity: i % 4 === 0 ? 20 : 30,
        occupied: 0, // No seats populated
        status: i === 7 ? 'En maintenance' : (i % 3 === 1 ? 'En route' : 'Disponible'),
        amenities,
        has_ac: true,
        has_toilet: true,
        has_wifi: true,
        has_catering: i % 2 === 0
      });

      const depTime = hours[i];
      const [hStr, mStr] = depTime.split(':');
      const arrHour = (parseInt(hStr) + 4) % 24;
      const arrMin = (parseInt(mStr) + 15) % 60;
      const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
      const isNight = parseInt(hStr) >= 21 || parseInt(hStr) < 5;

      // Journey matching filters & frontend representation
      const journeyAmenities = ['AC', 'Wi-Fi', 'Toilettes', 'Prises USB', 'Sièges VIP'];
      if (i % 2 === 0) journeyAmenities.push('Restauration');
      if (i % 4 === 0) journeyAmenities.push('Premium');

      const journeyAmenityKeys = ['ac', 'wifi', 'toilet', 'plug', 'reclining', 'ebillet', 'instant'];
      if (i % 2 === 0) journeyAmenityKeys.push('catering');

      // Outbound Journey (Douala -> Yaoundé)
      allJourneys.push({
        id: journeyId++,
        agency_id: agency.id,
        bus_id: busId,
        operator: `${agency.name} ${i % 4 === 0 ? 'Executive Class' : 'VIP'}`,
        logo: agency.logo,
        dep_time: depTime,
        arr_time: arrTime,
        duration: '4h15',
        dep_station: agency.depStation,
        arr_station: agency.arrStation,
        price: i % 4 === 0 ? 8000 : 6000,
        amenities: journeyAmenities,
        amenity_keys: journeyAmenityKeys,
        warning: null,
        is_night: isNight
      });

      // Calculate return journey timings (departure Yaoundé = arrival Douala + 1h15 layover)
      const retDepHour = (parseInt(hStr) + 5) % 24;
      const retDepMin = (parseInt(mStr) + 30) % 60;
      const retDepHourAdjusted = retDepMin < parseInt(mStr) ? (retDepHour + 1) % 24 : retDepHour;
      const retDepTime = `${String(retDepHourAdjusted).padStart(2, '0')}:${String(retDepMin).padStart(2, '0')}`;

      const retArrHour = (retDepHourAdjusted + 4) % 24;
      const retArrMin = (retDepMin + 15) % 60;
      const retArrHourAdjusted = retArrMin < retDepMin ? (retArrHour + 1) % 24 : retArrHour;
      const retArrTime = `${String(retArrHourAdjusted).padStart(2, '0')}:${String(retArrMin).padStart(2, '0')}`;
      const isNightRet = retDepHourAdjusted >= 21 || retDepHourAdjusted < 5;

      // Return Journey (Yaoundé -> Douala)
      allJourneys.push({
        id: journeyId++,
        agency_id: agency.id,
        bus_id: busId,
        operator: `${agency.name} ${i % 4 === 0 ? 'Executive Class' : 'VIP'}`,
        logo: agency.logo,
        dep_time: retDepTime,
        arr_time: retArrTime,
        duration: '4h15',
        dep_station: agency.arrStation,
        arr_station: agency.depStation,
        price: i % 4 === 0 ? 8000 : 6000,
        amenities: journeyAmenities,
        amenity_keys: journeyAmenityKeys,
        warning: null,
        is_night: isNightRet
      });
    }

    // --- 8 Classic Buses & Journeys ---
    for (let i = 0; i < 8; i++) {
      const busId = `BUS-${agency.id}-CLS-${i+1}`;
      const plaque = `${agency.platePrefix}-${2000 + agency.id*100 + i*10}-B`;

      // Diverse amenities for Classic (some with AC, some basic)
      const hasAc = i % 4 !== 0; // 75% have AC
      const amenities = ['luggage'];
      if (hasAc) amenities.push('ac');
      if (i % 3 === 0) amenities.push('usb'); // Some classics have USB

      allBuses.push({
        id: busId,
        agency_id: agency.id,
        plaque,
        bus_class: 'Classique',
        capacity: 70,
        occupied: 0, // No seats populated
        status: i === 6 ? 'En maintenance' : (i % 4 === 2 ? 'En route' : 'Disponible'),
        amenities,
        has_ac: hasAc,
        has_toilet: false,
        has_wifi: false,
        has_catering: false
      });

      const depTime = hours[i];
      const [hStr, mStr] = depTime.split(':');
      const arrHour = (parseInt(hStr) + 4) % 24;
      const arrMin = (parseInt(mStr) + 15) % 60;
      const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
      const isNight = parseInt(hStr) >= 21 || parseInt(hStr) < 5;

      const journeyAmenities = ['Classique'];
      if (hasAc) journeyAmenities.push('Climatisation');
      const journeyAmenityKeys = ['ebillet', 'instant'];
      if (hasAc) journeyAmenityKeys.push('ac');
      if (i % 3 === 0) journeyAmenityKeys.push('plug');

      // Outbound Journey (Douala -> Yaoundé)
      allJourneys.push({
        id: journeyId++,
        agency_id: agency.id,
        bus_id: busId,
        operator: `${agency.name} Classique`,
        logo: agency.logo,
        dep_time: depTime,
        arr_time: arrTime,
        duration: '4h15',
        dep_station: agency.depStation,
        arr_station: agency.arrStation,
        price: 3000,
        amenities: journeyAmenities,
        amenity_keys: journeyAmenityKeys,
        warning: null,
        is_night: isNight
      });

      // Calculate return journey timings (departure Yaoundé = arrival Douala + 1h15 layover)
      const retDepHour = (parseInt(hStr) + 5) % 24;
      const retDepMin = (parseInt(mStr) + 30) % 60;
      const retDepHourAdjusted = retDepMin < parseInt(mStr) ? (retDepHour + 1) % 24 : retDepHour;
      const retDepTime = `${String(retDepHourAdjusted).padStart(2, '0')}:${String(retDepMin).padStart(2, '0')}`;

      const retArrHour = (retDepHourAdjusted + 4) % 24;
      const retArrMin = (retDepMin + 15) % 60;
      const retArrHourAdjusted = retArrMin < retDepMin ? (retArrHour + 1) % 24 : retArrHour;
      const retArrTime = `${String(retArrHourAdjusted).padStart(2, '0')}:${String(retArrMin).padStart(2, '0')}`;
      const isNightRet = retDepHourAdjusted >= 21 || retDepHourAdjusted < 5;

      // Return Journey (Yaoundé -> Douala)
      allJourneys.push({
        id: journeyId++,
        agency_id: agency.id,
        bus_id: busId,
        operator: `${agency.name} Classique`,
        logo: agency.logo,
        dep_time: retDepTime,
        arr_time: retArrTime,
        duration: '4h15',
        dep_station: agency.arrStation,
        arr_station: agency.depStation,
        price: 3000,
        amenities: journeyAmenities,
        amenity_keys: journeyAmenityKeys,
        warning: null,
        is_night: isNightRet
      });
    }

    // B. 5 DISTINCT BUSES FOR RENTAL / LOCATION (Diverse categories, sizes, and options)
    // --- 5 Location Buses ---
    
    // Bus 1: Minibus (12 places) - Classique mapping to minibus
    allBuses.push({
      id: `BUS-${agency.id}-LOC-MINI`,
      agency_id: agency.id,
      plaque: `${agency.platePrefix}-${3000 + agency.id*100}-L`,
      bus_class: 'Classique', // mapped to minibus in frontend
      capacity: 12,
      occupied: 0,
      status: 'Disponible',
      amenities: ['ac', 'gps', 'usb', 'luggage'],
      has_ac: true,
      has_toilet: false,
      has_wifi: false,
      has_catering: false
    });

    // Bus 2: Confort Bus (30 places) - Confort class
    allBuses.push({
      id: `BUS-${agency.id}-LOC-CONF`,
      agency_id: agency.id,
      plaque: `${agency.platePrefix}-${3100 + agency.id*100}-L`,
      bus_class: 'Confort',
      capacity: 30,
      occupied: 0,
      status: 'Disponible',
      amenities: ['ac', 'wifi', 'tv', 'usb', 'gps', 'reclining', 'luggage', 'sono'],
      has_ac: true,
      has_toilet: false,
      has_wifi: true,
      has_catering: false
    });

    // Bus 3: VIP Luxury Bus (18 places) - VIP class
    allBuses.push({
      id: `BUS-${agency.id}-LOC-VIP`,
      agency_id: agency.id,
      plaque: `${agency.platePrefix}-${3200 + agency.id*100}-L`,
      bus_class: 'VIP',
      capacity: 18,
      occupied: 0,
      status: 'Disponible',
      amenities: ['ac', 'wifi', 'toilet', 'tv', 'usb', 'mini_bar', 'leather', 'gps', 'reclining', 'luggage', 'catering'],
      has_ac: true,
      has_toilet: true,
      has_wifi: true,
      has_catering: true
    });

    // Bus 4: Large Capacity Bus (80 places) - Classique class (maps to Grande capacity in capacity filter)
    allBuses.push({
      id: `BUS-${agency.id}-LOC-GRND`,
      agency_id: agency.id,
      plaque: `${agency.platePrefix}-${3300 + agency.id*100}-L`,
      bus_class: 'Classique',
      capacity: 80,
      occupied: 0,
      status: 'Disponible',
      amenities: ['ac', 'tv', 'luggage', 'sono', 'gps'],
      has_ac: true,
      has_toilet: false,
      has_wifi: false,
      has_catering: false
    });

    // Bus 5: Ceremonial / Marriage VIP Bus (35 places) - VIP / Executive Class
    allBuses.push({
      id: `BUS-${agency.id}-LOC-MARIAGE`,
      agency_id: agency.id,
      plaque: `${agency.platePrefix}-${3400 + agency.id*100}-L`,
      bus_class: 'Executive Class',
      capacity: 35,
      occupied: 0,
      status: 'Disponible',
      amenities: ['ac', 'wifi', 'tv', 'mini_bar', 'deco', 'sono', 'leather', 'catering', 'guide'],
      has_ac: true,
      has_toilet: true,
      has_wifi: true,
      has_catering: true
    });
  }

  // Insert all buses
  const { error: busErr } = await supabase.from('buses').insert(allBuses);
  if (busErr) console.error('  ❌ Erreur buses:', busErr.message);
  else console.log(`  ✅ ${allBuses.length} bus insérés (${agencyConfigs.length} agences × (16 trajets + 5 locations))`);

  // Insert all journeys
  const { error: jErr } = await supabase.from('journeys').insert(allJourneys);
  if (jErr) console.error('  ❌ Erreur journeys:', jErr.message);
  else console.log(`  ✅ ${allJourneys.length} trajets insérés (${agencyConfigs.length} agences × 16 horaires)`);

  console.log('\n====================================================');
  console.log('✅ SEED COMPLET, DIVERSIFIÉ ET COHÉRENT TERMINÉ !');
  console.log('====================================================');
}

seedDatabase().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
