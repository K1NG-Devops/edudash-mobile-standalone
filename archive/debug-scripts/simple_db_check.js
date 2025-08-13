#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 EduDash Pro Database Connection Check');
console.log('=========================================\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  console.error('Check your .env.local file for:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`📊 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Project ID: ${supabaseUrl.split('//')[1].split('.')[0]}`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  const tables = ['users', 'preschools', 'students', 'lessons'];
  
  console.log('📋 Checking database tables...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table does not exist`);
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`🔒 ${table}: Exists but RLS is blocking access (this is good!)`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Accessible, ${data ? data.length : 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Connection error - ${err.message}`);
    }
  }
}

async function main() {
  try {
    await checkTables();
    
    console.log('\n🎯 Your Supabase Database Dashboard:');
    console.log(`🌐 https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/editor`);
    
    console.log('\n📝 How to access your database:');
    console.log('1. Visit: https://supabase.com/dashboard');
    console.log('2. Find your project (look for "lvvvjywrmpcqrpvuptdi" or your project name)');
    console.log('3. Click: Database → Tables (to see tables)');
    console.log('4. Click: Database → SQL Editor (to run SQL commands)');
    
    console.log('\n🔧 To deploy RLS security:');
    console.log('1. Go to SQL Editor in your Supabase dashboard');
    console.log('2. Copy and paste the contents of:');
    console.log('   supabase/migrations/20250806_secure_rls_policies.sql');
    console.log('3. Click RUN to apply the security policies');
    
  } catch (error) {
    console.error('❌ Failed to check database:', error.message);
  }
  
  console.log('\n✨ Check completed!');
}

main();
