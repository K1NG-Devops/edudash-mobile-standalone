/**
 * Simple test for auth user creation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testSimpleAuthCreation() {
  try {
    console.log('🧪 Testing simple auth user creation...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'simple-test@example.com',
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (error) {
      console.error('❌ Auth creation failed:', error);
      return;
    }

    console.log('✅ Auth user created successfully:', data.user?.id);
    console.log('User email:', data.user?.email);
    
    // Clean up
    console.log('🧹 Cleaning up...');
    await supabase.auth.admin.deleteUser(data.user.id);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSimpleAuthCreation();
