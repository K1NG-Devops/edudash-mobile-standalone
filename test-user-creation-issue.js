#!/usr/bin/env node

/**
 * Test script to debug the Supabase auth user creation issue
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create admin client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'supabase_auth_admin_test',
  }
});

console.log('🔧 Testing Supabase Admin User Creation');
console.log('=====================================');

async function testUserCreation() {
  try {
    console.log('1. Testing admin client connection...');
    
    // Test basic connection
    const { count: testCount, error: testError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
      
    if (testError) {
      console.error('❌ Admin client connection failed:', testError);
      return;
    }
    
    console.log('✅ Admin client connection successful');
    
    // Generate test user data
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!@#';
    
    console.log('2. Attempting to create test auth user...');
    console.log('   Email:', testEmail);
    
    // Try to create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'teacher',
        created_via: 'debug_test'
      }
    });
    
    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      console.error('   Error message:', authError.message);
      console.error('   Error details:', JSON.stringify(authError, null, 2));
      
      // Check if it's a database constraint issue
      if (authError.message.includes('Database error')) {
        console.log('');
        console.log('🔍 Checking database constraints...');
        
        // Check if there are any constraint violations in users table
        const { data: constraints, error: constraintError } = await supabaseAdmin
          .rpc('get_table_constraints', { table_name: 'users' })
          .catch(() => ({ data: null, error: 'Function not available' }));
          
        if (constraints) {
          console.log('   Database constraints:', constraints);
        }
      }
      
      return;
    }
    
    console.log('✅ Auth user created successfully');
    console.log('   User ID:', authUser.user?.id);
    
    // Wait a moment for triggers to process
    console.log('3. Waiting for triggers to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if user profile was created
    console.log('4. Checking if user profile was created...');
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ User profile not found:', profileError);
      console.log('   This suggests the trigger failed to create the profile');
    } else {
      console.log('✅ User profile created by trigger');
      console.log('   Profile:', JSON.stringify(userProfile, null, 2));
    }
    
    // Cleanup - delete the test user
    console.log('5. Cleaning up test user...');
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

// Run the test
testUserCreation().then(() => {
  console.log('');
  console.log('🎯 Test completed');
}).catch(error => {
  console.error('❌ Test failed with error:', error);
});
