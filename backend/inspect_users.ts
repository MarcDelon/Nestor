import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAgenciesPassword() {
  console.log('--- MISE A JOUR DU MOT DE PASSE DES 5 AGENCES A "123456" ---');
  
  const emails = [
    'finexs@safetrip.cm',
    'buca@safetrip.cm',
    'general@safetrip.cm',
    'touristique@safetrip.cm',
    'men@safetrip.cm'
  ];

  // Hash bcrypt pour "123456"
  const newHash = '$2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi';

  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .in('email', emails)
    .select();

  if (error) {
    console.error('❌ Erreur lors de la mise à jour des mots de passe:', error);
  } else {
    console.log('✅ Mots de passe des 5 agences mis à jour avec succès !');
    console.log(`Nombre de comptes modifiés : ${data?.length || 0}`);
  }
}

updateAgenciesPassword();
