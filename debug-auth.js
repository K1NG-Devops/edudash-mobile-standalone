#!/usr/bin/env node

// Debug script to test Supabase authentication
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}


// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    
    // Test basic connection with simple query
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      console.error('Error details:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Connection test exception:', err.message);
    return false;
  }
}

async function testAuth() {
  
  // Test credentials from logs
  const testCredentials = [
    { email: 'king@youngeagles.org.za', password: 'EduDash0dy3r!!' },
    { email: 'admin@edudash.com', password: 'admin123' },
    { email: 'demo@edudash.com', password: 'demo123' }
  ];
  
  for (const cred of testCredentials) {
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });
      
      if (error) {
      } else if (data?.user) {
        
        // Test profile lookup
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', data.user.id)
            .single();
            
          if (profileError) {
          } else {
          }
        } catch (profileErr) {
        }
        
        // Sign out
        await supabase.auth.signOut();
        return true;
      }
    } catch (err) {
    }
  }
  
  return false;
}

async function listUsers() {
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .limit(10);
    
    if (error) {
      return;
    }
    
    if (data && data.length > 0) {
      data.forEach(user => {
      });
    } else {
    }
  } catch (err) {
  }
}

async function main() {
  const connectionOk = await testConnection();
  
  if (!connectionOk) {
    return;
  }
  
  await listUsers();
  const authOk = await testAuth();
  
  if (!authOk) {
  }
  
}

main().catch(console.error);
