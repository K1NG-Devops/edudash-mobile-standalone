#!/usr/bin/env node

/**
 * Test script for resend welcome instructions functionality
 * This helps debug the resend email issue
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // For testing data visibility

console.log('🧪 Testing Resend Welcome Instructions Functionality\n');

if (!supabaseUrl) {
  console.log('❌ EXPO_PUBLIC_SUPABASE_URL not found');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.log('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not found');
  process.exit(1);
}

async function testResendFlow() {
  try {
    // 1. Create Supabase client
    console.log('1️⃣ Creating Supabase client...');
    const clientKey = serviceRoleKey || supabaseAnonKey;
    const clientType = serviceRoleKey ? 'service role (bypasses RLS)' : 'anon key (with RLS)';
    const supabase = createClient(supabaseUrl, clientKey);
    console.log(`   ✅ Client created successfully using ${clientType}\n`);

    // 1.5. Check what tables exist
    console.log('🗺️ Checking database schema...');
    try {
      // Try to list some common table variations
      const tableChecks = [
        'preschools',
        'schools', 
        'preschool_onboarding_requests',
        'onboarding_requests',
        'onboard_requests',
        'school_requests',
        'registration_requests',
        'users',
        'profiles',
        'auth_users',
        'temp_passwords',
        'email_logs'
      ];
      
      const existingTables = [];
      for (const table of tableChecks) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error) {
            existingTables.push(table);
          }
        } catch (e) {
          // Table doesn't exist, continue
        }
      }
      
      if (existingTables.length > 0) {
        console.log(`   ✅ Found tables: ${existingTables.join(', ')}`);
      } else {
        console.log('   ⚠️ No expected tables found - database might not be set up');
        return;
      }
    } catch (error) {
      console.log('   ❌ Schema check failed:', error.message);
    }
    console.log('');

    // 2. Find an approved school for testing
    console.log('2️⃣ Looking for approved schools...');
    const { data: schools, error: schoolsError } = await supabase
      .from('preschools')
      .select('id, name, email, subscription_status, onboarding_status')
      .limit(5);

    if (schoolsError) {
      console.log('   ❌ Error fetching schools:', schoolsError.message);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('   ⚠️ No schools found in database');
      
      // Check for pending onboarding requests
      console.log('\n🔍 Checking for onboarding requests...');
      const { data: requests, error: requestsError } = await supabase
        .from('preschool_onboarding_requests')
        .select('id, preschool_name, admin_email, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (requestsError) {
        console.log('   ❌ Error fetching onboarding requests:', requestsError.message);
      } else if (!requests || requests.length === 0) {
        console.log('   ⚠️ No onboarding requests found either');
        console.log('   💡 You need to create some onboarding requests first!');
      } else {
        console.log(`   ✅ Found ${requests.length} onboarding requests:`);
        requests.forEach((req, index) => {
        console.log(`      ${index + 1}. ${req.preschool_name} (${req.admin_email})`);
          console.log(`         Status: ${req.status}, Created: ${new Date(req.created_at).toLocaleDateString()}`);
        });
        
        const pendingRequests = requests.filter(r => r.status === 'pending');
        if (pendingRequests.length > 0) {
          console.log(`   💡 ${pendingRequests.length} pending request(s) could be approved to create schools`);
        }
      }
      
      return;
    }

    console.log(`   ✅ Found ${schools.length} schools:`);
    schools.forEach((school, index) => {
      console.log(`      ${index + 1}. ${school.name} (${school.email})`);
      console.log(`         Status: ${school.subscription_status}, Onboarding: ${school.onboarding_status}`);
    });
    console.log('');

    // 3. Find admins for these schools
    console.log('3️⃣ Looking for school admins...');
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id, name, email, role, preschool_id, is_active, auth_user_id')
      .in('preschool_id', schools.map(s => s.id))
      .in('role', ['principal', 'admin', 'preschool_admin']);

    if (adminsError) {
      console.log('   ❌ Error fetching admins:', adminsError.message);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('   ⚠️ No admin users found for these schools');
      return;
    }

    console.log(`   ✅ Found ${admins.length} admin users:`);
    admins.forEach((admin, index) => {
      const school = schools.find(s => s.id === admin.preschool_id);
      console.log(`      ${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`         School: ${school?.name || 'Unknown'}`);
      console.log(`         Role: ${admin.role}, Active: ${admin.is_active}`);
    });
    console.log('');

    // 4. Test edge function availability
    console.log('4️⃣ Testing edge function availability...');
    try {
      const { data: testResult, error: testError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'test@example.com',
          subject: 'Test Connection',
          html: '<p>Test</p>',
          templateType: 'test'
        }
      });

      if (testError) {
        console.log('   ⚠️ Edge function error (expected for test):', testError.message);
      } else {
        console.log('   ✅ Edge function accessible');
      }
    } catch (error) {
      console.log('   ⚠️ Edge function test failed (expected):', error.message);
    }
    console.log('');

    // 5. Summary and recommendations
    console.log('📋 ANALYSIS SUMMARY:');
    console.log('');

    const hasSchools = schools.length > 0;
    const hasAdmins = admins.length > 0;
    const hasActiveAdmins = admins.filter(a => a.is_active).length > 0;

    console.log(`✅ Schools in database: ${hasSchools ? 'YES' : 'NO'} (${schools.length})`);
    console.log(`✅ Admin users found: ${hasAdmins ? 'YES' : 'NO'} (${admins.length})`);
    console.log(`✅ Active admins: ${hasActiveAdmins ? 'YES' : 'NO'} (${admins.filter(a => a.is_active).length})`);

    console.log('');
    console.log('🔧 POTENTIAL ISSUES:');

    if (!hasSchools) {
      console.log('   ❌ No schools in database - create some schools first');
    }

    if (!hasAdmins) {
      console.log('   ❌ No admin users - school approval process may not be working');
    }

    if (!hasActiveAdmins) {
      console.log('   ❌ No active admin users - check user activation process');
    }

    // Check for missing auth_user_id
    const adminsWithoutAuth = admins.filter(a => !a.auth_user_id);
    if (adminsWithoutAuth.length > 0) {
      console.log(`   ❌ ${adminsWithoutAuth.length} admin(s) missing auth_user_id - this will break resend`);
    }

    console.log('');
    console.log('💡 RECOMMENDATIONS:');

    if (hasSchools && hasActiveAdmins) {
      console.log('   ✅ Basic setup looks good - resend should work');
      const testSchool = schools[0];
      const testAdmin = admins.find(a => a.preschool_id === testSchool.id && a.is_active);
      
      if (testAdmin) {
        console.log(`   🧪 To test resend, try with:`);
        console.log(`      School: ${testSchool.name} (ID: ${testSchool.id})`);
        console.log(`      Admin: ${testAdmin.name} (${testAdmin.email})`);
      }
    } else {
      console.log('   ⚠️ Need to fix basic setup before resend will work');
      console.log('   1. Create approved schools via onboarding requests');
      console.log('   2. Ensure admin users are created with valid auth_user_id');
      console.log('   3. Make sure users are marked as active');
    }

    console.log('');
    console.log('🔍 Next steps:');
    console.log('   1. Try the onboarding flow in the app');
    console.log('   2. Approve a request to create a school + admin');
    console.log('   3. Then test the resend functionality');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

testResendFlow();
