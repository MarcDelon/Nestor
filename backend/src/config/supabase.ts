import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force ts-node-dev to load .env using the absolute path of the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log(`✅ Supabase Client connecté avec succès à l'URL: ${supabaseUrl}`);
  } catch (error) {
    console.error('❌ Erreur de connexion Supabase Client:', error);
  }
} else {
  console.warn(
    '⚠️ Supabase non configuré ou URL invalide dans le fichier .env.\n' +
    'Le serveur fonctionnera en mode simulation locale pour les tests.'
  );
}

export const supabase = supabaseClient;
