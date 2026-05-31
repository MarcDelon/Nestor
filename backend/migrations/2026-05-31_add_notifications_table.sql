-- Add notifications table for real-time alerts and ensure vouchers columns exist
BEGIN;

-- Vouchers adjustments (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vouchers' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE vouchers ADD COLUMN assigned_to UUID REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vouchers' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE vouchers ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL;
  END IF;
END $$;

-- Notifications table
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

COMMIT;
