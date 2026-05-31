-- ====================================================================
-- SAFETRIP DATABASE SCHEMA (CLEAN REBUILD)
-- ====================================================================

-- DROP EXISTING TABLES IN DEPENDENCY ORDER TO AVOID VIOLATIONS
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS colis CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;
DROP TABLE IF EXISTS journeys CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. ENUM TYPE FOR ROLES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'agency', 'admin');
    END IF;
END$$;

-- 1b. UNIFIED USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  photo TEXT DEFAULT '/images/default_avatar.png',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 3. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  photo TEXT DEFAULT '/images/default_admin.png',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 4. AGENCIES TABLE (Agences partenaires)
-- ====================================================================
CREATE TABLE IF NOT EXISTS agencies (
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
);
ALTER TABLE agencies DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 5. BUSES TABLE (Flotte de bus par agence)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bus_class') THEN
        CREATE TYPE bus_class AS ENUM ('VIP', 'Confort', 'Classique', 'Executive Class');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bus_status') THEN
        CREATE TYPE bus_status AS ENUM ('En route', 'En maintenance', 'Disponible');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS buses (
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
);
ALTER TABLE buses DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 6. JOURNEYS TABLE (Trajets / Horaires planifiés)
-- ====================================================================
CREATE TABLE IF NOT EXISTS journeys (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  bus_id TEXT REFERENCES buses(id) ON DELETE SET NULL,
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
);
ALTER TABLE journeys DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 7. PASSENGERS TABLE (Passagers réservés par trajet)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passenger_status') THEN
        CREATE TYPE passenger_status AS ENUM ('Payé', 'Enregistré', 'En attente');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS passengers (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER REFERENCES journeys(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  seat TEXT,
  status passenger_status NOT NULL DEFAULT 'Payé',
  luggage_count INTEGER NOT NULL DEFAULT 0,
  luggage_scanned BOOLEAN NOT NULL DEFAULT false,
  ticket_qr_token TEXT UNIQUE,
  ticket_scanned BOOLEAN NOT NULL DEFAULT false,
  ticket_scanned_at TIMESTAMP WITH TIME ZONE,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE passengers DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 8. COLIS TABLE (Colis / Bagages enregistrés)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colis_type') THEN
        CREATE TYPE colis_type AS ENUM ('Valise', 'Sac', 'Carton', 'Sac à dos', 'Colis');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colis_status') THEN
        CREATE TYPE colis_status AS ENUM ('À bord du bus', 'En transit', 'Livré', 'En attente de scan', 'Scanné en gare');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS colis (
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
);
ALTER TABLE colis DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 9. MESSAGES TABLE (Chat agence)
-- ====================================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('agency', 'contact')),
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  reply_to_id INTEGER,
  reply_to_text TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 10. SERVICE REQUESTS TABLE (Demandes clients via formulaire / Smartsupp)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type') THEN
        CREATE TYPE request_type AS ENUM ('livraison', 'envoi_colis', 'demande_speciale', 'autre');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('nouveau', 'en_cours', 'traite', 'annule');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS service_requests (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
  request_type request_type NOT NULL DEFAULT 'autre',
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date TEXT,
  origin_city TEXT,
  destination_city TEXT,
  status request_status NOT NULL DEFAULT 'nouveau',
  smartsupp_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 11. VOUCHERS TABLE (Bons de réduction créés par l'admin)
-- ====================================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  max_uses INTEGER NOT NULL DEFAULT 100,
  current_uses INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES clients(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 12. LOYALTY POINTS TABLE (Points fidélité par client)
-- ====================================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE loyalty_points DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 13. NOTIFICATIONS TABLE (Notifications temps réel)
-- ====================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- SEED DATA NOTE
-- ====================================================================
-- Database seeding is handled programmatically via the backend seeding script.
-- To seed the database with unified user data, please run:
-- npx ts-node seed_db.ts
