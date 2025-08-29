#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}


// Create client with anon key first
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    
    // Query public users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, name, role, auth_user_id, is_active, created_at')
      .or('email.ilike.%king%,email.ilike.%youngeagles%')
      .limit(10);
    
    if (publicError) {
    } else {
      if (publicUsers && publicUsers.length > 0) {
        publicUsers.forEach(user => {
        });
      }
    }
    
    
    // Try to get any user to test RLS
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('email, name, role')
      .limit(5);
    
    if (allError) {
    } else {
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach(user => {
        });
      }
    }

  } catch (error) {
    console.error('❌ Exception occurred:', error.message);
  }
}

async function testAuth() {
  
  const testCredentials = [
    'king@youngeagles.org.za'
  ];
  
  for (const email of testCredentials) {
    try {
      
      // Try to trigger password reset to see if user exists
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/reset-password'
      });
      
      if (error) {
        if (error.message.includes('User not found')) {
        } else {
        }
      } else {
      }
    } catch (err) {
    }
  }
}

async function main() {
  await checkUsers();
  await testAuth();
  
}

main().catch(console.error);
