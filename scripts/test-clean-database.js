#!/usr/bin/env node
/**
 * Test clean database state with only superadmin user
 * Run: node scripts/test-clean-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCleanDatabase() {
  
  try {
    
    // Test users table - should be blocked by RLS
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(10);
      
    if (usersError && usersError.code === '42501') {
    } else if (usersError) {
    } else {
    }
    
    
    // Test other core tables
    const tables = ['preschools', 'age_groups', 'classes', 'students', 'teachers', 'parents'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (error && error.code === '42501') {
        } else if (error && error.code === 'PGRST106') {
        } else if (error) {
        } else {
        }
      } catch (err) {
      }
    }
    
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
    } else if (!session) {
    } else {
    }
    
    
    const config = {
      supabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      aiModel: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL,
      debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE,
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT
    };
    
    
    
    
    
  } catch (error) {
    console.error('❌ Clean database test failed:', error.message);
    return false;
  }
  
  return true;
}

if (require.main === module) {
  testCleanDatabase().catch(console.error);
}
