#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      'king@youngeagles.org.za',
      {
        redirectTo: process.env.EXPO_PUBLIC_WEB_URL + '/reset-password'
      }
    );
    
    if (error) {
      console.error('❌ Password reset failed:', error.message);
      console.error('   Code:', error.status);
      return false;
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Exception during password reset:', err.message);
    return false;
  }
}

async function createProfile() {
  
  // First try to sign in with any password to get user ID
  // This won't work but might give us info
  
  try {
  } catch (err) {
  }
}

async function main() {
  const resetSuccess = await resetPassword();
  
  if (resetSuccess) {
    await createProfile();
    
  }
}

main().catch(console.error);
