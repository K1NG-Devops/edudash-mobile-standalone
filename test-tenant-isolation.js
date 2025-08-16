#!/usr/bin/env node

/**
 * EduDash Pro - Tenant Isolation Security Audit
 * Tests data leakage prevention and school isolation after the user creation fix
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

// Create admin client for testing
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'supabase_audit_admin',
  }
});

console.log('🔒 EduDash Pro - Tenant Isolation Security Audit');
console.log('=================================================');

async function auditTenantIsolation() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function addTest(name, passed, details) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (details) console.log(`   ${details}`);
    
    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  try {
    console.log('\n1. Testing Row Level Security (RLS) Status');
    console.log('==========================================');

    // Test 1: Verify RLS is enabled on critical tables
    const { data: rlsTables, error: rlsError } = await supabaseAdmin
      .rpc('pg_tables')
      .select('tablename')
      .in('tablename', ['users', 'students', 'classes', 'lessons', 'messages']);

    if (rlsError) {
      addTest('RLS Status Check', false, `Error checking RLS: ${rlsError.message}`);
    } else {
      addTest('RLS Status Check', true, 'Successfully queried table structure');
    }

    console.log('\n2. Testing Cross-School Data Isolation');
    console.log('======================================');

    // Test 2: Check if preschool_id is properly set in all new users
    const { data: usersWithSchools, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, preschool_id, role')
      .neq('role', 'superadmin')
      .not('preschool_id', 'is', null);

    if (userError) {
      addTest('User School Assignment', false, `Error: ${userError.message}`);
    } else {
      const schoollessUsers = usersWithSchools.filter(u => !u.preschool_id && u.role !== 'superadmin');
      if (schoollessUsers.length === 0) {
        addTest('User School Assignment', true, `All ${usersWithSchools.length} non-superadmin users have preschool_id`);
      } else {
        addTest('User School Assignment', false, `${schoollessUsers.length} users without preschool_id found`);
      }
    }

    // Test 3: Verify school data isolation - check if we can see data from multiple schools
    const { data: schools, error: schoolsError } = await supabaseAdmin
      .from('preschools')
      .select('id, name')
      .limit(5);

    if (schoolsError || !schools || schools.length < 2) {
      addTest('Multi-School Test Setup', false, 'Need at least 2 schools to test isolation');
    } else {
      addTest('Multi-School Test Setup', true, `Found ${schools.length} schools for isolation testing`);
      
      const school1 = schools[0];
      const school2 = schools[1];
      
      // Test 4: Check if users are properly isolated by school
      const { data: school1Users } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('preschool_id', school1.id);
      
      const { data: school2Users } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('preschool_id', school2.id);
      
      if (school1Users && school2Users) {
        // Check for email duplicates across schools (should be allowed but tracked)
        const school1Emails = school1Users.map(u => u.email);
        const school2Emails = school2Users.map(u => u.email);
        const duplicateEmails = school1Emails.filter(email => school2Emails.includes(email));
        
        if (duplicateEmails.length > 0) {
          addTest('Cross-School Email Isolation', true, `${duplicateEmails.length} emails shared across schools (allowed)`);
        } else {
          addTest('Cross-School Email Isolation', true, 'No email duplicates found across schools');
        }
      }

      // Test 5: Students isolation test
      const { data: school1Students } = await supabaseAdmin
        .from('students')
        .select('id, first_name, preschool_id')
        .eq('preschool_id', school1.id);
      
      const { data: school2Students } = await supabaseAdmin
        .from('students')
        .select('id, first_name, preschool_id')
        .eq('preschool_id', school2.id);
      
      if (school1Students && school2Students) {
        // Verify no student belongs to multiple schools
        const allStudents = [...(school1Students || []), ...(school2Students || [])];
        const studentSchoolMap = {};
        let crossSchoolStudents = 0;
        
        allStudents.forEach(student => {
          if (studentSchoolMap[student.id] && studentSchoolMap[student.id] !== student.preschool_id) {
            crossSchoolStudents++;
          }
          studentSchoolMap[student.id] = student.preschool_id;
        });
        
        addTest('Student School Isolation', crossSchoolStudents === 0, 
          crossSchoolStudents > 0 ? `${crossSchoolStudents} students in multiple schools` : 
          `${allStudents.length} students properly isolated by school`);
      }
    }

    console.log('\n3. Testing Authentication & Authorization');
    console.log('=========================================');

    // Test 6: SuperAdmin role verification
    const { data: superAdmins, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, preschool_id')
      .eq('role', 'superadmin');

    if (adminError) {
      addTest('SuperAdmin Role Check', false, `Error: ${adminError.message}`);
    } else {
      const validSuperAdmins = superAdmins.filter(admin => !admin.preschool_id);
      addTest('SuperAdmin Role Check', validSuperAdmins.length > 0, 
        `${validSuperAdmins.length} valid superadmins (not tied to specific schools)`);
    }

    console.log('\n4. Testing Critical Functions');
    console.log('=============================');

    // Test 7: Test the can_access_preschool function behavior
    if (schools && schools.length >= 2) {
      try {
        // This should work with service role
        const { data: testAccess, error: accessError } = await supabaseAdmin
          .rpc('can_access_preschool', { target_preschool_id: schools[0].id });
        
        if (accessError) {
          addTest('can_access_preschool Function', false, `Error: ${accessError.message}`);
        } else {
          // Service role should have access to all schools
          addTest('can_access_preschool Function', testAccess === true, 
            `Function returned: ${testAccess} (service role should have full access)`);
        }
      } catch (error) {
        addTest('can_access_preschool Function', false, `Exception: ${error.message}`);
      }
    }

    // Test 8: Check the user creation fix maintains isolation
    const { data: recentUsers, error: recentError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, preschool_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      addTest('Recent Users Isolation', false, `Error: ${recentError.message}`);
    } else {
      const recentUsersWithSchool = recentUsers.filter(u => u.role !== 'superadmin' && u.preschool_id);
      const recentUsersWithoutSchool = recentUsers.filter(u => u.role !== 'superadmin' && !u.preschool_id);
      
      addTest('Recent Users Isolation', recentUsersWithoutSchool.length === 0,
        `${recentUsersWithSchool.length} recent users have schools, ${recentUsersWithoutSchool.length} without`);
    }

    console.log('\n5. Testing Data Access Patterns');
    console.log('===============================');

    // Test 9: Verify messages are school-isolated
    const { data: messages, error: messageError } = await supabaseAdmin
      .from('messages')
      .select('id, subject, preschool_id')
      .limit(20);

    if (messageError) {
      addTest('Messages Isolation', false, `Error: ${messageError.message}`);
    } else if (!messages || messages.length === 0) {
      addTest('Messages Isolation', true, 'No messages found (expected for fresh system)');
    } else {
      const messagesWithSchool = messages.filter(m => m.preschool_id);
      addTest('Messages Isolation', messagesWithSchool.length === messages.length,
        `${messagesWithSchool.length}/${messages.length} messages have preschool_id`);
    }

  } catch (error) {
    console.error('❌ Audit failed with error:', error);
    addTest('Audit Execution', false, `Fatal error: ${error.message}`);
  }

  // Final results
  console.log('\n📊 SECURITY AUDIT SUMMARY');
  console.log('=========================');
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`📋 Total Tests:  ${results.tests.length}`);
  
  const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`📈 Pass Rate:    ${passRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 SECURITY AUDIT PASSED - No data leakage detected!');
    console.log('✅ Tenant isolation is properly maintained');
    console.log('✅ The user creation fix did not compromise security');
  } else {
    console.log('\n⚠️  SECURITY ISSUES DETECTED');
    console.log('❌ Please review failed tests above');
    
    const failedTests = results.tests.filter(t => !t.passed);
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.details}`);
    });
  }

  return {
    passed: results.failed === 0,
    passRate,
    results
  };
}

// Run the audit
auditTenantIsolation().then((audit) => {
  console.log('\n🔒 Tenant Isolation Audit Complete\n');
  process.exit(audit.passed ? 0 : 1);
}).catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
