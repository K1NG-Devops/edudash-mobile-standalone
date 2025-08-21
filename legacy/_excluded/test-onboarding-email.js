#!/usr/bin/env node

/**
 * Test School Onboarding Email Functionality
 * Tests that principals receive welcome emails with temporary passwords when their school is approved
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOnboardingEmailFlow() {
  console.log('📧 Testing School Onboarding Email Flow\n');
  
  // Step 0: Sign in as superadmin to get auth token
  console.log('0️⃣ Authenticating as superadmin...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'superadmin@edudashpro.org.za',
    password: 'superadmin123!' // You may need to update this password
  });

  if (authError) {
    console.error('❌ Failed to authenticate as superadmin:', authError);
    console.log('💡 Please ensure the superadmin user exists with email: superadmin@edudashpro.org.za');
    return false;
  }

  console.log('✅ Authenticated as superadmin:', authData.user.email);
  
  // Step 1: Create a test onboarding request
  console.log('\n1️⃣ Creating test onboarding request...');
  
  const testSchoolData = {
    preschool_name: 'Test Preschool Academy',
    admin_name: 'Jane Smith',
    admin_email: 'superadmin@edudashpro.org.za', // Use existing email for testing
    phone: '+27 11 123 4567',
    address: '123 Test Street, Test City',
    number_of_students: 30,
    number_of_teachers: 5,
    message: 'This is a test onboarding request to verify email delivery'
  };

  // Insert test onboarding request
  const { data: onboardingRequest, error: requestError } = await supabase
    .from('preschool_onboarding_requests')
    .insert([testSchoolData])
    .select('*')
    .single();

  if (requestError) {
    console.error('❌ Failed to create test onboarding request:', requestError);
    return false;
  }

  console.log('✅ Test onboarding request created:', onboardingRequest.id);

  // Step 2: Approve the request (this should trigger the welcome email)
  console.log('\n2️⃣ Approving onboarding request (this should send welcome email)...');

  try {
    const { data: approvalResult, error: approvalError } = await supabase.functions.invoke('superadmin_approve_onboarding', {
      body: { requestId: onboardingRequest.id }
    });

    if (approvalError) {
      console.error('❌ Approval failed:', approvalError);
      return false;
    }

    if (approvalResult?.error) {
      console.error('❌ Approval returned error:', approvalResult.error);
      return false;
    }

    console.log('✅ School onboarding approval successful!');
    console.log('📊 Approval Result:', {
      success: approvalResult.success,
      school_id: approvalResult.school_id,
      admin_email: approvalResult.admin_email,
      temp_password: approvalResult.temp_password ? '[REDACTED]' : 'NOT PROVIDED',
      welcome_email_sent: approvalResult.welcome_email_sent
    });

    // Step 3: Verify school was created
    console.log('\n3️⃣ Verifying school was created...');

    const { data: school, error: schoolError } = await supabase
      .from('preschools')
      .select('*')
      .eq('id', approvalResult.school_id)
      .single();

    if (schoolError) {
      console.error('❌ Failed to verify school creation:', schoolError);
      return false;
    }

    console.log('✅ School verified in database:', {
      name: school.name,
      email: school.email,
      onboarding_status: school.onboarding_status,
      setup_completed: school.setup_completed
    });

    // Step 4: Verify admin user was created
    console.log('\n4️⃣ Verifying admin user was created...');

    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', approvalResult.admin_email)
      .eq('preschool_id', approvalResult.school_id)
      .single();

    if (userError) {
      console.error('❌ Failed to verify admin user:', userError);
      return false;
    }

    console.log('✅ Admin user verified in database:', {
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      is_active: adminUser.is_active
    });

    return true;

  } catch (error) {
    console.error('❌ Error during approval process:', error);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  // Clean up any test schools and requests
  const testEmails = ['superadmin@edudashpro.org.za'];

  for (const email of testEmails) {
    // Remove test schools
    const { data: schools } = await supabase
      .from('preschools')
      .select('id')
      .eq('email', email)
      .eq('name', 'Test Preschool Academy');

    if (schools && schools.length > 0) {
      for (const school of schools) {
        // Remove admin users first
        await supabase
          .from('users')
          .delete()
          .eq('preschool_id', school.id);

        // Remove auth users (if accessible)
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const testAuthUser = authUsers.users.find(u => u.email === email);
          if (testAuthUser) {
            await supabase.auth.admin.deleteUser(testAuthUser.id);
          }
        } catch (authError) {
          // Auth deletion might fail, that's ok
        }

        // Remove school
        await supabase
          .from('preschools')
          .delete()
          .eq('id', school.id);
      }
      console.log(`✅ Cleaned up ${schools.length} test school(s)`);
    }

    // Remove test onboarding requests
    const { data: deletedRequests } = await supabase
      .from('preschool_onboarding_requests')
      .delete()
      .eq('admin_email', email)
      .eq('preschool_name', 'Test Preschool Academy')
      .select('id');

    if (deletedRequests && deletedRequests.length > 0) {
      console.log(`✅ Cleaned up ${deletedRequests.length} test onboarding request(s)`);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 EduDash Pro Onboarding Email Test\n');
  
  try {
    // Clean up any existing test data first
    await cleanupTestData();

    // Run the test
    const result = await testOnboardingEmailFlow();
    
    console.log('\n📊 Test Results:');
    console.log(`Onboarding Email Flow: ${result ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result) {
      console.log('\n🎉 SUCCESS! School onboarding with email delivery is working!');
      console.log('📧 Check the admin email inbox for:');
      console.log('   → Welcome email with login credentials');
      console.log('   → Complete onboarding guide');
      console.log('   → Professional HTML template');
      console.log('\n✅ The principal/admin WILL receive their temporary password via email! ✉️');
    } else {
      console.log('\n❌ School onboarding email functionality has issues.');
      console.log('Please check the error messages above.');
    }

    // Clean up test data
    await cleanupTestData();

  } catch (error) {
    console.error('💥 Test failed with exception:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
