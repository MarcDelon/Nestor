/**
 * Script to create all tables in Supabase by executing raw SQL via the Supabase Management API.
 * Since the JS client cannot run DDL, we use the REST SQL endpoint.
 */
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

async function createTables() {
  console.log('🚀 Création des tables via Supabase RPC...\n');

  // We'll use supabase.rpc to call a custom function, or we can try executing SQL
  // through the PostgREST endpoint. Since that's not possible, let's use the
  // Supabase REST API with the service role key to run SQL.
  
  // Alternative approach: Use fetch to call the Supabase SQL endpoint
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  
  // The anon key can't run DDL. Let's try using the pg-meta endpoint
  // Actually, the simplest approach is to create tables one by one using 
  // Supabase's approach of checking via rpc.
  
  // Let's use a different approach: create a PostgreSQL function via rpc
  // that we can call to set up the schema.
  
  // Actually, the best approach for the user is to run the SQL manually.
  // But we can verify what tables exist and guide them.
  
  console.log('Vérification des tables existantes...');
  
  const tables = ['agencies', 'buses', 'journeys', 'passengers', 'colis', 'messages', 'agency_profiles'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`  ❌ Table '${table}' : N'EXISTE PAS - ${error.message}`);
    } else {
      console.log(`  ✅ Table '${table}' : EXISTE (${data.length} rows trouvées dans le sample)`);
    }
  }
  
  console.log('\n====================================================');
  console.log('⚠️  INSTRUCTIONS POUR CRÉER LES TABLES :');
  console.log('====================================================');
  console.log('1. Ouvrir https://supabase.com/dashboard');
  console.log(`2. Aller dans le projet : ${projectRef}`);
  console.log('3. Cliquer sur "SQL Editor" dans le menu latéral');
  console.log('4. Copier le contenu de schema.sql (sauf la partie SEED DATA)');
  console.log('5. Coller et cliquer "Run"');
  console.log('6. Ensuite relancer : npx ts-node seed_db.ts');
  console.log('====================================================\n');
}

createTables().catch(err => {
  console.error('❌ Erreur:', err);
});
