#!/usr/bin/env node
/**
 * Debug script to check user profile and permissions
 * Run: node scripts/debug-user-profile.js
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

async function debugUserProfile() {
  
  try {
    // Check auth session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return;
    }
    
    if (!session) {
      return;
    }
    
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();
      
    if (profileError) {
      if (profileError.code === '42501') {
      } else if (profileError.code === 'PGRST116') {
      } else {
      }
      return;
    }
    
    
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function checkRLSPolicies() {
  
  try {
    // This query should work for authenticated users due to our RLS policies
    const { data, error } = await supabase
      .rpc('get_user_profile_debug', { user_id: '90e3c48e-412d-48cf-8008-31d78b3d7845' });
      
    if (error) {
    } else {
    }
  } catch (error) {
  }
}

async function suggestFixes() {
}

async function main() {
  
  await debugUserProfile();
  await checkRLSPolicies();
  await suggestFixes();
}

if (require.main === module) {
  main().catch(console.error);
}
