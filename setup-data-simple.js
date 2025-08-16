#!/usr/bin/env node

/**
 * Simple database setup script using service role key
 * This bypasses RLS to create test data directly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log('❌ No service role key found. Please check your .env files.');
  process.exit(1);
}

console.log('🛠️ Setting up EduDash Pro test data...\n');

// Add crypto polyfill if not available
if (typeof crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  global.crypto = webcrypto;
}

async function setupTestData() {
  try {
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('1️⃣ Creating superadmin user...');
    
    const superAdminUuid = crypto.randomUUID();
    const { data: superadmin, error: superadminError } = await supabase
      .from('users')
      .upsert([{
        id: superAdminUuid,
        auth_user_id: superAdminUuid,
        name: 'Super Administrator',
        email: 'admin@edudashpro.org.za',
        role: 'superadmin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { onConflict: 'email' })
      .select()
      .single();

    if (superadminError) {
      console.log('   ❌ Error creating superadmin:', superadminError.message);
      return;
    }

    console.log('   ✅ Superadmin created/updated successfully');

    console.log('\n2️⃣ Creating sample onboarding requests...');
    
    const sampleRequests = [
      {
        preschool_name: 'Sunny Side Preschool',
        admin_name: 'Sarah Johnson',
        admin_email: 'sarah@sunnysidepreschool.co.za',
        phone: '+27 11 123 4567',
        address: '123 Oak Street, Johannesburg, 2000',
        number_of_students: 45,
        number_of_teachers: 6,
        message: 'We are excited to join EduDash Pro to better manage our growing preschool.',
        status: 'pending'
      },
      {
        preschool_name: 'Little Stars Academy',
        admin_name: 'Michael Thompson',
        admin_email: 'michael@littlestars.co.za',
        phone: '+27 21 987 6543',
        address: '456 Pine Avenue, Cape Town, 8000',
        number_of_students: 30,
        number_of_teachers: 4,
        message: 'Looking forward to digitizing our administrative processes.',
        status: 'pending'
      }
    ];

    const { data: requests, error: requestError } = await supabase
      .from('preschool_onboarding_requests')
      .upsert(sampleRequests, { onConflict: 'admin_email' })
      .select();

    if (requestError) {
      console.log('   ❌ Error creating requests:', requestError.message);
      return;
    }

    console.log(`   ✅ Created ${requests.length} onboarding requests`);
    
    console.log('\n3️⃣ Approving first request and creating school + admin...');
    
    const requestToApprove = requests[0];
    
    // Mark request as approved
    await supabase
      .from('preschool_onboarding_requests')
      .update({
        status: 'approved',
        reviewed_by: superadmin.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestToApprove.id);

    // Create the preschool
    const schoolId = crypto.randomUUID();
    const { data: school, error: schoolError } = await supabase
      .from('preschools')
      .upsert([{
        id: schoolId,
        name: requestToApprove.preschool_name,
        email: requestToApprove.admin_email,
        phone: requestToApprove.phone,
        address: requestToApprove.address,
        subscription_status: 'active',
        onboarding_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { onConflict: 'email' })
      .select()
      .single();

    if (schoolError) {
      console.log('   ❌ Error creating school:', schoolError.message);
      return;
    }

    // Create the admin user
    const adminId = crypto.randomUUID();
    const authUserId = crypto.randomUUID();
    
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .upsert([{
        id: adminId,
        auth_user_id: authUserId,
        name: requestToApprove.admin_name,
        email: requestToApprove.admin_email,
        role: 'principal',
        preschool_id: school.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { onConflict: 'email' })
      .select()
      .single();

    if (adminError) {
      console.log('   ❌ Error creating admin:', adminError.message);
      return;
    }

    console.log('   ✅ Successfully created:');
    console.log(`      🏫 School: ${school.name} (ID: ${school.id})`);
    console.log(`      👨‍💼 Admin: ${admin.name} (${admin.email})`);
    console.log(`      🔐 Auth ID: ${admin.auth_user_id}`);

    console.log('\n4️⃣ Testing the data structure for resend functionality...');
    
    // Test query that mimics resendWelcomeInstructions
    const { data: testData, error: testError } = await supabase
      .from('preschools')
      .select(`
        id, 
        name, 
        email, 
        subscription_status,
        users!inner(id, name, email, role, is_active, auth_user_id)
      `)
      .in('users.role', ['principal', 'admin', 'preschool_admin'])
      .eq('users.is_active', true)
      .eq('id', school.id)
      .single();

    if (testError) {
      console.log('   ⚠️ Test query failed:', testError.message);
      console.log('   This might indicate an issue with the data structure');
    } else if (testData && testData.users && testData.users.length > 0) {
      const testAdmin = testData.users[0];
      console.log('   ✅ Data structure looks good for resend!');
      console.log(`      School: ${testData.name}`);
      console.log(`      Admin: ${testAdmin.name} (${testAdmin.email})`);
      console.log(`      Has auth_user_id: ${testAdmin.auth_user_id ? 'YES' : 'NO'}`);
      console.log(`      Is active: ${testAdmin.is_active ? 'YES' : 'NO'}`);
    } else {
      console.log('   ⚠️ Data query succeeded but no admin users found');
    }

    console.log('\n✅ Test data setup complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Created superadmin: ${superadmin.email}`);
    console.log(`   - Created ${requests.length} onboarding requests`);
    console.log(`   - Approved and created school: ${school.name}`);
    console.log(`   - Created admin user: ${admin.name}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Open your app and log in as superadmin');
    console.log('   2. Go to the Onboarding tab');
    console.log('   3. You should see pending requests and an approved school');
    console.log('   4. Try the "Resend Instructions" button on the approved school');
    
    // Run the resend test now that we have data
    console.log('\n🧪 Now run: node test-resend.js');

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

setupTestData();
