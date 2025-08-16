#!/usr/bin/env node

/**
 * Simple script runner to execute SQL files via Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  console.log(`🗂️  Reading SQL file: ${filePath}`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`📏 File size: ${sqlContent.length} characters`);
    console.log(`🚀 Executing SQL script...`);
    console.log('');
    
    // Execute the SQL using the RPC function
    const { data, error } = await supabaseAdmin.rpc('exec', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('❌ SQL execution failed:', error.message);
      console.error('Details:', error);
      return false;
    }
    
    console.log('✅ SQL script executed successfully!');
    if (data && data.length > 0) {
      console.log('📊 Result:', data);
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Error reading or executing SQL file:', err.message);
    return false;
  }
}

// Get the SQL file path from command line arguments
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.log('Usage: node run-sql.js <path-to-sql-file>');
  console.log('Example: node run-sql.js scripts/fix-database-issues.sql');
  process.exit(1);
}

const fullPath = path.resolve(sqlFile);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ SQL file not found: ${fullPath}`);
  process.exit(1);
}

console.log('🔧 EduDash Pro SQL Script Runner');
console.log('=================================');
console.log(`🔗 Database: ${supabaseUrl}`);
console.log(`🔑 Using service role: ${supabaseServiceKey ? 'Yes' : 'No'}`);
console.log('');

runSQLFile(fullPath)
  .then(success => {
    if (success) {
      console.log('');
      console.log('🎉 Script execution completed successfully!');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ Script execution failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
