const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Use service role key if available, otherwise use anon key with limited access
const supabaseKey = serviceRoleKey || anonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!serviceRoleKey) {
  console.log('⚠️  Running audit with anon key (limited access due to RLS)');
  console.log('   For full audit, provide SUPABASE_SERVICE_ROLE_KEY as environment variable\n');
} else {
  console.log('✅ Running audit with service role key (full access)\n');
}

async function auditDatabase() {
  console.log('🔍 Starting comprehensive database audit...\n');

  try {
    // 1. Check superadmin users
    console.log('1. Checking superadmin users...');
    const { data: superadmins, error: superadminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', 'superadmin');

    if (superadminError) {
      console.error('❌ Error fetching superadmins:', superadminError);
    } else {
      console.log(`✅ Found ${superadmins.length} superadmin(s):`);
      superadmins.forEach(admin => {
        console.log(`   - ID: ${admin.id}, Email: ${admin.email}, Name: ${admin.first_name} ${admin.last_name}`);
      });
    }

    // 2. Check schools
    console.log('\n2. Checking schools...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*');

    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError);
    } else {
      console.log(`✅ Found ${schools.length} school(s):`);
      schools.forEach(school => {
        console.log(`   - ID: ${school.id}, Name: ${school.name}, Status: ${school.status}`);
      });
    }

    // 3. Check onboarding requests
    console.log('\n3. Checking onboarding requests...');
    const { data: onboardingRequests, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .select('*');

    if (onboardingError) {
      console.error('❌ Error fetching onboarding requests:', onboardingError);
    } else {
      console.log(`✅ Found ${onboardingRequests.length} onboarding request(s):`);
      onboardingRequests.forEach(request => {
        console.log(`   - ID: ${request.id}, Email: ${request.admin_email}, Status: ${request.status}, School: ${request.school_name}`);
      });
    }

    // 4. Check preschool admin users
    console.log('\n4. Checking preschool admin users...');
    const { data: preschoolAdmins, error: preschoolAdminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', 'preschool_admin');

    if (preschoolAdminError) {
      console.error('❌ Error fetching preschool admins:', preschoolAdminError);
    } else {
      console.log(`✅ Found ${preschoolAdmins.length} preschool admin(s):`);
      preschoolAdmins.forEach(admin => {
        console.log(`   - ID: ${admin.id}, Email: ${admin.email}, Name: ${admin.first_name} ${admin.last_name}, School ID: ${admin.school_id}`);
      });
    }

    // 5. Check relationship integrity
    console.log('\n5. Checking relationship integrity...');
    
    // Check if onboarding requests have corresponding approved schools
    const approvedRequests = onboardingRequests.filter(req => req.status === 'approved');
    console.log(`   - Approved onboarding requests: ${approvedRequests.length}`);
    
    for (const request of approvedRequests) {
      const correspondingSchool = schools.find(school => 
        school.name === request.school_name || school.id === request.school_id
      );
      
      if (correspondingSchool) {
        console.log(`   ✅ Request ${request.id} has corresponding school: ${correspondingSchool.name}`);
        
        // Check if there's an admin for this school
        const schoolAdmin = preschoolAdmins.find(admin => admin.school_id === correspondingSchool.id);
        if (schoolAdmin) {
          console.log(`   ✅ School ${correspondingSchool.name} has admin: ${schoolAdmin.email}`);
        } else {
          console.log(`   ⚠️  School ${correspondingSchool.name} missing admin user`);
        }
      } else {
        console.log(`   ⚠️  Request ${request.id} missing corresponding school`);
      }
    }

    // 6. Check pending requests for resend functionality
    console.log('\n6. Checking pending requests (resend candidates)...');
    const pendingRequests = onboardingRequests.filter(req => req.status === 'pending');
    console.log(`   - Pending requests: ${pendingRequests.length}`);
    
    if (pendingRequests.length > 0) {
      console.log('   These requests can be used to test resend functionality:');
      pendingRequests.forEach(request => {
        console.log(`   - ${request.admin_email} (${request.school_name})`);
      });
    }

    // 7. Test database connectivity and permissions
    console.log('\n7. Testing database permissions...');
    
    // Try to read with anon key
    const anonSupabase = createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    const { data: anonData, error: anonError } = await anonSupabase
      .from('onboarding_requests')
      .select('count')
      .limit(1);
    
    if (anonError) {
      console.log('   ⚠️  Anon key has limited access (this is expected due to RLS)');
    } else {
      console.log('   ✅ Anon key can read data');
    }

    // 8. Check Edge Function accessibility
    console.log('\n8. Checking Edge Function...');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:8081',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,x-client-info,apikey,content-type'
        }
      });
      
      if (response.ok) {
        console.log('   ✅ Edge Function accessible and handles CORS properly');
        console.log(`   - Status: ${response.status}`);
        console.log(`   - CORS Headers: ${response.headers.get('Access-Control-Allow-Origin')}`);
      } else {
        console.log(`   ⚠️  Edge Function response: ${response.status}`);
      }
    } catch (error) {
      console.log('   ❌ Error accessing Edge Function:', error.message);
    }

    console.log('\n🎯 Database Audit Summary:');
    console.log(`   - Superadmins: ${superadmins.length}`);
    console.log(`   - Schools: ${schools.length}`);
    console.log(`   - Onboarding Requests: ${onboardingRequests.length}`);
    console.log(`   - Preschool Admins: ${preschoolAdmins.length}`);
    console.log(`   - Approved Requests: ${approvedRequests.length}`);
    console.log(`   - Pending Requests: ${pendingRequests.length}`);

    // Final assessment
    console.log('\n🔔 Resend Functionality Assessment:');
    if (superadmins.length > 0 && onboardingRequests.length > 0) {
      console.log('✅ Database is ready for resend functionality testing');
      console.log('✅ You can log in as superadmin and test resending welcome instructions');
    } else {
      console.log('❌ Database needs setup - missing required data');
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

auditDatabase();
