const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runDatabaseSetup() {
  console.log('🚀 Running database setup...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('complete-database-setup.sql', 'utf8');
    
    console.log('📝 Executing database setup script...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative method - split SQL into individual statements
      console.log('\n🔄 Trying alternative approach - executing statements individually...');
      
      // Split the SQL content by semicolons and execute each statement
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📋 Found ${statements.length} SQL statements to execute`);
      
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (statement.includes('RAISE NOTICE')) {
          // Skip RAISE NOTICE statements as they're PostgreSQL specific
          continue;
        }
        
        try {
          // Use a simple query for CREATE TABLE, INSERT, etc.
          if (statement.toUpperCase().includes('CREATE TABLE') || 
              statement.toUpperCase().includes('CREATE EXTENSION') ||
              statement.toUpperCase().includes('CREATE INDEX') ||
              statement.toUpperCase().includes('ALTER TABLE') ||
              statement.toUpperCase().includes('CREATE POLICY') ||
              statement.toUpperCase().includes('INSERT INTO')) {
            
            const { error: stmtError } = await supabase.rpc('exec_sql', {
              sql: statement
            });
            
            if (stmtError && !stmtError.message.includes('already exists')) {
              console.log(`⚠️  Statement ${i + 1} failed:`, stmtError.message);
              failureCount++;
            } else {
              successCount++;
            }
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed:`, err.message);
          failureCount++;
        }
      }
      
      console.log(`\n📊 Results: ${successCount} successful, ${failureCount} failed`);
    } else {
      console.log('✅ Database setup completed successfully!');
    }

    // Verify the tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tables = ['schools', 'admin_users', 'onboarding_requests'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' verification failed:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' verification failed:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

runDatabaseSetup();
