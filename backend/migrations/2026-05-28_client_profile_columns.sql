-- Migration: Add address, city, and language_pref to clients table

ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS language_pref TEXT DEFAULT 'fr';
