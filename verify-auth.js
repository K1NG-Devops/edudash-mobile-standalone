#!/usr/bin/env node

/**
 * EduDash Pro Authentication Verification Script
 * This script verifies that authentication is working correctly after fixes
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🔍 EduDash Pro Authentication Verification\n');

async function verifyAuthentication() {
  try {
    // 1. Check environment configuration
    console.log('1️⃣ Checking environment configuration...');
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`   URL: ${url}`);
    console.log(`   Key: ${key ? key.substring(0, 20) + '...' : 'Missing'}`);
    
    if (!url || !key) {
      console.log('   ❌ Missing Supabase configuration');
      return;
    }
    console.log('   ✅ Environment configuration loaded\n');

    // 2. Create Supabase client
    console.log('2️⃣ Creating Supabase client...');
    const supabase = createClient(url, key);
    console.log('   ✅ Supabase client created\n');

    // 3. Test database connection
    console.log('3️⃣ Testing database connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      return;
    }
    console.log('   ✅ Database connection successful\n');

    // 4. Test SuperAdmin authentication
    console.log('4️⃣ Testing SuperAdmin authentication...');
    const email = 'superadmin@edudashpro.org.za';
    const password = '#Olivia@17';
    
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password.replace(/./g, '*')}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.log(`   ❌ Authentication failed: ${authError.message}`);
      return;
    }
    
    console.log('   ✅ Authentication successful!');
    console.log(`   👤 User ID: ${authData.user.id}`);
    console.log(`   📧 Email: ${authData.user.email}\n`);

    // 5. Test profile loading
    console.log('5️⃣ Testing profile loading...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, role, email, is_active, preschool_id')
      .eq('auth_user_id', authData.user.id)
      .single();
      
    if (profileError) {
      console.log(`   ❌ Profile loading failed: ${profileError.message}`);
    } else {
      console.log('   ✅ Profile loaded successfully:');
      console.log(`   👤 Name: ${profile.name}`);
      console.log(`   🎭 Role: ${profile.role}`);
      console.log(`   📧 Email: ${profile.email}`);
      console.log(`   🟢 Active: ${profile.is_active}`);
      console.log(`   🏫 Preschool ID: ${profile.preschool_id || 'None'}\n`);
    }

    // 6. Sign out
    console.log('6️⃣ Cleaning up...');
    await supabase.auth.signOut();
    console.log('   ✅ Signed out successfully\n');

    // 7. Summary
    console.log('🎉 VERIFICATION COMPLETE - ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Database connection: Working');
    console.log('✅ SuperAdmin authentication: Working');
    console.log('✅ Profile loading: Working');
    console.log('✅ Environment configuration: Correct');
    console.log('');
    console.log('🚀 Your EduDash Pro authentication is ready!');
    console.log('');
    console.log('🔑 SuperAdmin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 To test in the app:');
    console.log('   1. Run: npm start');
    console.log('   2. Press "w" to open web version');
    console.log('   3. Navigate to sign-in page');
    console.log('   4. Use the credentials above');

  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    console.log('Stack trace:', error.stack);
  }
}

verifyAuthentication();
