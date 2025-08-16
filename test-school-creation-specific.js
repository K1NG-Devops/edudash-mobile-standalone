#!/usr/bin/env node

/**
 * Test script to debug the exact school creation context that's failing
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

// Create admin client with service role (exact same setup as the app)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'supabase_auth_admin',
  }
});

console.log('🔧 Testing Exact School Creation Context');
console.log('=====================================');

async function testExactSchoolCreation() {
  try {
    console.log('1. Testing admin client connection...');
    
    // Use the exact same test as the app
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
      .single();
    console.log('🔧 [SuperAdmin] Admin client test result:', { testData, testError });
    
    // Test school data (similar to what fails)
    const schoolData = {
      name: 'Test School Debug',
      email: `debug-school-${Date.now()}@test.com`,
      admin_name: 'Debug Admin',
      subscription_plan: 'trial'
    };
    
    console.log('2. Creating school record...');
    
    // Create the school record using admin client (exact same code)
    const { data: schoolRecord, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .insert({
        name: schoolData.name,
        email: schoolData.email,
        subscription_plan: schoolData.subscription_plan || 'trial',
        subscription_status: 'active',
        tenant_slug: schoolData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        onboarding_status: 'completed',
        setup_completed: true
      })
      .select('*')
      .single();

    if (schoolError) {
      console.error('❌ Error creating school record:', schoolError);
      return;
    }

    console.log('✅ School record created:', schoolRecord.id);

    // Generate secure password (exact same method)
    const generateSecurePassword = () => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      const symbols = '!@#$%^&*';

      // Ensure at least one character from each required category
      const password = [
        lowercase[Math.floor(Math.random() * lowercase.length)],
        uppercase[Math.floor(Math.random() * uppercase.length)],
        digits[Math.floor(Math.random() * digits.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      // Fill remaining positions with random characters from all categories
      const allChars = lowercase + uppercase + digits + symbols;
      for (let i = 4; i < 12; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
      }

      // Shuffle the password array and join
      return password.sort(() => Math.random() - 0.5).join('');
    };

    const tempPassword = generateSecurePassword();

    console.log('3. Creating auth user with exact same metadata...');
    
    // Use the FIXED createUser call (with minimal metadata only)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: schoolData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: schoolData.admin_name
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      console.error('   Error message:', authError.message);
      console.error('   Error code:', authError.code);
      console.error('   Error status:', authError.status);
      console.error('   Full error:', JSON.stringify(authError, null, 2));
      
      // Clean up school record
      await supabaseAdmin.from('preschools').delete().eq('id', schoolRecord.id);
      console.log('🧹 Cleaned up school record');
      
      return;
    }
    
    console.log('✅ Auth user created successfully');
    console.log('   User ID:', authUser.user?.id);
    console.log('   User email:', authUser.user?.email);
    
    // Wait for trigger processing
    console.log('4. Waiting for trigger processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if user profile was created by trigger
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.user.id)
      .single();

    if (checkError || !existingProfile) {
      console.log('⚠️  Trigger did not create user profile, would create manually...');
      console.log('   Check error:', checkError);
    } else {
      console.log('✅ User profile created by trigger');
      console.log('   Profile preschool_id:', existingProfile.preschool_id);
      console.log('   Profile role:', existingProfile.role);
    }
    
    // Cleanup
    console.log('5. Cleaning up test data...');
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    await supabaseAdmin.from('preschools').delete().eq('id', schoolRecord.id);
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
    console.error('   Stack trace:', error.stack);
  }
}

// Run the test
testExactSchoolCreation().then(() => {
  console.log('');
  console.log('🎯 Test completed');
}).catch(error => {
  console.error('❌ Test failed with error:', error);
});
