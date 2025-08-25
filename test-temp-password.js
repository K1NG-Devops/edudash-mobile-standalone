#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTempPasswordFlow() {
  
  try {
    // First, sign in with the current credentials
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'king@youngeagles.org.za',
      password: 'EduDash2024!'
    });
    
    if (authError) {
      return;
    }
    
    
    // Now check the current user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, role, password_reset_required')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (profileError) {
      return;
    }
    
      name: profile.name,
      role: profile.role,
      passwordResetRequired: profile.password_reset_required
    });
    
    // For testing, we can simulate setting password_reset_required = true
    // This would normally be set when creating new users with temp passwords
    
    
    // Sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTempPasswordFlow().catch(console.error);
