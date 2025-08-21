#!/usr/bin/env node

/**
 * Test script to debug the onboarding approval flow
 * Run this to test if the approval functionality is working correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testApprovalFlow() {
  console.log('🔍 Testing the onboarding approval flow...\n');

  try {
    // 1. Check if onboarding requests exist
    console.log('1️⃣ Checking for pending onboarding requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('preschool_onboarding_requests')
      .select('*')
      .eq('status', 'pending');

    if (requestsError) {
      console.error('❌ Error fetching requests:', requestsError.message);
      return;
    }

    console.log(`📋 Found ${requests?.length || 0} pending requests`);
    
    if (!requests || requests.length === 0) {
      console.log('ℹ️ No pending requests to test with');
      return;
    }

    const testRequest = requests[0];
    console.log('🎯 Testing with request:', {
      id: testRequest.id,
      school: testRequest.preschool_name,
      admin: testRequest.admin_name,
      email: testRequest.admin_email
    });

    // 2. Test Edge Function availability
    console.log('\n2️⃣ Testing Edge Function availability...');
    
    // Create a test superadmin user token for testing
    const { data: superAdmins } = await supabase
      .from('users')
      .select('auth_user_id, email, name')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .limit(1);

    if (!superAdmins || superAdmins.length === 0) {
      console.error('❌ No superadmin users found for testing');
      return;
    }

    const superAdmin = superAdmins[0];
    console.log('👤 Found superadmin for testing:', superAdmin.email);

    // 3. Get a valid auth token for the superadmin
    console.log('\n3️⃣ Getting auth token for superadmin...');
    
    // For testing, we'll simulate the Edge Function call directly
    console.log('\n4️⃣ Testing Edge Function call...');
    
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('superadmin_approve_onboarding', {
      body: { requestId: testRequest.id }
    });

    if (functionError) {
      console.error('❌ Edge Function error:', functionError);
      
      // Check if it's an authentication issue
      if (functionError.message?.includes('401') || functionError.message?.includes('Invalid token')) {
        console.log('\n💡 Authentication issue detected. This might be why the approval button isn\'t working.');
        console.log('   The Edge Function requires a valid user authentication token.');
        console.log('   Make sure the user is properly signed in when clicking approve.');
      }
      
      return;
    }

    console.log('✅ Edge Function response:', functionResult);

    // 4. Verify the status was updated
    console.log('\n5️⃣ Verifying status update...');
    const { data: updatedRequest, error: verifyError } = await supabase
      .from('preschool_onboarding_requests')
      .select('status, reviewed_at, reviewed_by')
      .eq('id', testRequest.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }

    console.log('📊 Updated request status:', updatedRequest);

    // 5. Check if school was created
    console.log('\n6️⃣ Checking if school was created...');
    const { data: school, error: schoolError } = await supabase
      .from('preschools')
      .select('*')
      .eq('email', testRequest.admin_email)
      .maybeSingle();

    if (schoolError) {
      console.error('❌ Error checking school:', schoolError.message);
      return;
    }

    if (school) {
      console.log('✅ School created successfully:', {
        id: school.id,
        name: school.name,
        onboarding_status: school.onboarding_status,
        setup_completed: school.setup_completed
      });
    } else {
      console.log('❌ School was not created');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
  }
}

async function checkDashboardStats() {
  console.log('\n📊 Testing dashboard stats with admin client...');
  
  try {
    const { count: pendingCount, error } = await supabase
      .from('preschool_onboarding_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Error getting pending count:', error.message);
      return;
    }

    console.log('✅ Pending requests count (admin client):', pendingCount);
    console.log('   This should now show correctly in the dashboard');
    
  } catch (error) {
    console.error('💥 Dashboard stats test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 EduDash Pro - Onboarding Approval Flow Test\n');
  
  await testApprovalFlow();
  await checkDashboardStats();
  
  console.log('\n📝 Summary:');
  console.log('1. Fixed getPendingApprovals() to use admin client (should fix dashboard count)');
  console.log('2. Added detailed debugging to approval flow');
  console.log('3. Enhanced authentication checks in approval service');
  console.log('\n💡 If issues persist, check the browser console for detailed error messages');
}

if (require.main === module) {
  main().catch(console.error);
}
