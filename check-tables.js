const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkExistingTables() {
  console.log('🔍 Checking what tables exist in your database...\n');

  try {
    // Query the information schema to see what tables exist
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          table_name,
          table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (error) {
      console.log('Trying alternative method to list tables...');
      
      // Try direct query to pg_tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename, schemaname')
        .eq('schemaname', 'public');

      if (tablesError) {
        console.log('❌ Cannot access table information. Checking specific tables...');
        
        // Try to access some common table names to see what exists
        const tablesToCheck = [
          'admin_users',
          'schools', 
          'onboarding_requests',
          'users',
          'profiles',
          'auth.users'
        ];

        console.log('Checking individual tables:');
        for (const tableName of tablesToCheck) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
              
            if (!error) {
              console.log(`✅ Table '${tableName}' exists`);
            } else {
              console.log(`❌ Table '${tableName}' does not exist: ${error.message}`);
            }
          } catch (e) {
            console.log(`❌ Error accessing '${tableName}': ${e.message}`);
          }
        }
      } else {
        console.log('📋 Existing tables in public schema:');
        tablesData.forEach(table => {
          console.log(`   - ${table.tablename}`);
        });
      }
    } else {
      console.log('📋 Existing tables in public schema:');
      data.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
  }
}

checkExistingTables();
