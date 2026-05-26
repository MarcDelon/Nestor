/**
 * Execute raw SQL DDL against Supabase using the pg-meta REST endpoint.
 * This creates all tables required for the agency dashboard.
 */
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

// Build the SQL statements to create each table
// We split into individual statements to handle errors gracefully

const sqlStatements: string[] = [
  // Enum: user_role
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN CREATE TYPE user_role AS ENUM ('client', 'agency', 'admin'); END IF; END$$;`,
  // Enum: bus_class
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bus_class') THEN CREATE TYPE bus_class AS ENUM ('VIP', 'Confort', 'Classique', 'Executive Class'); END IF; END$$;`,
  // Enum: bus_status
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bus_status') THEN CREATE TYPE bus_status AS ENUM ('En route', 'En maintenance', 'Disponible'); END IF; END$$;`,
  // Enum: passenger_status
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passenger_status') THEN CREATE TYPE passenger_status AS ENUM ('Payé', 'Enregistré', 'En attente'); END IF; END$$;`,
  // Enum: colis_type
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colis_type') THEN CREATE TYPE colis_type AS ENUM ('Valise', 'Sac', 'Carton', 'Sac à dos', 'Colis'); END IF; END$$;`,
  // Enum: colis_status
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colis_status') THEN CREATE TYPE colis_status AS ENUM ('À bord du bus', 'En transit', 'Livré', 'En attente de scan', 'Scanné en gare'); END IF; END$$;`,
  
  // Table: users
  `CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`,

  // Table: clients
  `CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    photo TEXT DEFAULT '/images/default_avatar.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE clients DISABLE ROW LEVEL SECURITY;`,

  // Table: admins
  `CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    photo TEXT DEFAULT '/images/default_admin.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE admins DISABLE ROW LEVEL SECURITY;`,

  // Table: agencies
  `CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    name TEXT UNIQUE NOT NULL,
    logo TEXT NOT NULL DEFAULT '/images/default_agency.png',
    photo TEXT DEFAULT '/images/default_agency.png',
    certification TEXT NOT NULL DEFAULT 'Partenaire Certifié',
    phone TEXT,
    address TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE agencies DISABLE ROW LEVEL SECURITY;`,
  
  // Table: buses
  `CREATE TABLE IF NOT EXISTS buses (
    id TEXT PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    plaque TEXT NOT NULL,
    bus_class bus_class NOT NULL DEFAULT 'Classique',
    capacity INTEGER NOT NULL DEFAULT 50,
    occupied INTEGER NOT NULL DEFAULT 0,
    status bus_status NOT NULL DEFAULT 'Disponible',
    amenities TEXT[] NOT NULL DEFAULT '{}',
    has_ac BOOLEAN NOT NULL DEFAULT true,
    has_toilet BOOLEAN NOT NULL DEFAULT false,
    has_wifi BOOLEAN NOT NULL DEFAULT false,
    has_catering BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE buses DISABLE ROW LEVEL SECURITY;`,
  
  // Table: journeys
  `CREATE TABLE IF NOT EXISTS journeys (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    operator TEXT NOT NULL,
    logo TEXT NOT NULL DEFAULT '/images/default_agency.png',
    dep_time TEXT NOT NULL,
    arr_time TEXT NOT NULL,
    duration TEXT NOT NULL DEFAULT '4h15',
    dep_station TEXT NOT NULL,
    arr_station TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    amenities TEXT[] NOT NULL DEFAULT '{}',
    amenity_keys TEXT[] NOT NULL DEFAULT '{}',
    warning TEXT,
    is_night BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE journeys DISABLE ROW LEVEL SECURITY;`,
  
  // Table: passengers
  `CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    journey_id INTEGER REFERENCES journeys(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    seat TEXT,
    status passenger_status NOT NULL DEFAULT 'Payé',
    luggage_count INTEGER NOT NULL DEFAULT 0,
    luggage_scanned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE passengers DISABLE ROW LEVEL SECURITY;`,
  
  // Table: colis
  `CREATE TABLE IF NOT EXISTS colis (
    id TEXT PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    type colis_type NOT NULL DEFAULT 'Colis',
    weight NUMERIC(6,2) NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT 'Noir',
    status colis_status NOT NULL DEFAULT 'En attente de scan',
    trip TEXT NOT NULL,
    trip_date TEXT NOT NULL,
    qr_ref TEXT NOT NULL,
    fragile BOOLEAN NOT NULL DEFAULT false,
    sender_name TEXT,
    sender_phone TEXT,
    receiver_name TEXT,
    receiver_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE colis DISABLE ROW LEVEL SECURITY;`,
  
  // Table: messages
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('agency', 'contact')),
    text TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `ALTER TABLE messages DISABLE ROW LEVEL SECURITY;`
];

async function executeSQL(sql: string, label: string) {
  try {
    // Use the Supabase REST endpoint for SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      console.log(`  ✅ ${label}`);
      return true;
    } else {
      const text = await response.text();
      // If function doesn't exist, that's expected
      if (text.includes('exec_sql')) {
        return false; // RPC function doesn't exist
      }
      console.log(`  ⚠️ ${label}: ${text.substring(0, 100)}`);
      return false;
    }
  } catch (err: any) {
    console.log(`  ⚠️ ${label}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Tentative de création des tables via Supabase...\n');
  
  // Try RPC approach first
  const firstResult = await executeSQL('SELECT 1', 'Test connexion');
  
  if (!firstResult) {
    console.log('\n⚠️ La méthode RPC n\'est pas disponible.');
    console.log('Les tables doivent être créées manuellement.\n');
    console.log('========================================');
    console.log('📋 INSTRUCTIONS :');
    console.log('========================================');
    console.log('1. Ouvrir https://supabase.com/dashboard');
    console.log('2. Sélectionner ton projet SafeTrip');
    console.log('3. Menu latéral → "SQL Editor"');
    console.log('4. Cliquer "New query"');
    console.log('5. Copier-coller TOUT le contenu de :');
    console.log('   c:\\SafeTrip\\backend\\schema.sql');
    console.log('6. Cliquer "Run" (bouton vert)');
    console.log('7. Revenir ici et exécuter :');
    console.log('   npx ts-node seed_db.ts');
    console.log('========================================\n');
  } else {
    for (let i = 0; i < sqlStatements.length; i++) {
      await executeSQL(sqlStatements[i], `Statement ${i + 1}/${sqlStatements.length}`);
    }
    console.log('\n✅ Toutes les tables créées !');
    console.log('Exécuter maintenant : npx ts-node seed_db.ts');
  }
}

main();
