#!/usr/bin/env node
/**
 * Test script to verify RLS policies are working correctly
 * Run: node scripts/test-rls-fix.js
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

async function testRLSPolicy() {
  
  try {
    // Test basic connection
    const { data: healthCheck, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (connectionError) {
      if (connectionError.code === '42P17') {
        return false;
      } else {
        return false;
      }
    }
    
    
    // Test authentication flow (without actual login)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (session) {
      
      // Test user profile query
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();
        
      if (profileError) {
        if (profileError.code === '42P17') {
          return false;
        } else {
        }
      } else {
      }
    } else {
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  
  const success = await testRLSPolicy();
  
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
