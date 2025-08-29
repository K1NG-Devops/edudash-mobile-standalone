#!/usr/bin/env node
/**
 * Debug script to check auth and profile linking issues
 * Run: node scripts/debug-auth-linking.js
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

async function debugAuthLinking() {
  
  try {
    // 1. Check current auth session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return;
    }
    
    if (session) {
      
      // 2. Try to find matching profile
      
      // First try with auth_user_id
      const { data: profileById, error: profileByIdError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', session.user.id);
        
      if (profileByIdError) {
      } else if (profileById && profileById.length > 0) {
        return; // Profile is linked correctly
      } else {
      }
      
      // Try by email
      const { data: profileByEmail, error: profileByEmailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email);
        
      if (profileByEmailError) {
      } else if (profileByEmail && profileByEmail.length > 0) {
      } else {
      }
      
    } else {
      
      // 3. Check if superadmin profile exists
      
      const { data: superadminProfile, error: superadminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'superadmin@edudashpro.org.za');
        
      if (superadminError) {
      } else if (superadminProfile && superadminProfile.length > 0) {
      } else {
      }
    }
    
    // 4. Check subscription requirement
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

if (require.main === module) {
  debugAuthLinking().catch(console.error);
}
