-- ====================================================================
-- SAFETRIP DATABASE SCHEMA
-- ====================================================================

-- 1. ENUM TYPE FOR ROLES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'agency', 'admin');
    END IF;
END$$;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'client' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ROW LEVEL SECURITY (RLS) CONFIGURATION
-- Par défaut, Supabase active parfois le RLS qui bloque les insertions anonymes.
-- Option A (Recommandé pour le développement) : Désactiver le RLS pour autoriser toutes les requêtes directes.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option B (Alternative de production) : Activer le RLS et ajouter des politiques explicites.
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public inserts" ON users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public select" ON users FOR SELECT USING (true);

