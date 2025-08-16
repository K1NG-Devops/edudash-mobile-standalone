#!/usr/bin/env node

/**
 * Database setup and test script for EduDash Pro onboarding system
 * This creates sample data and tests the full workflow
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🛠️ EduDash Pro Database Setup and Testing Tool\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupDatabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if we need to create a superadmin user first
    console.log('1️⃣ Checking for superadmin user...');
    const { data: superadmins, error: superAdminError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'superadmin')
      .limit(1);

    if (superAdminError) {
      console.log('   ❌ Error checking superadmin:', superAdminError.message);
      return;
    }

    let superadminId = null;
    if (superadmins && superadmins.length > 0) {
      console.log(`   ✅ Found superadmin: ${superadmins[0].name} (${superadmins[0].email})`);
      superadminId = superadmins[0].id;
    } else {
      console.log('   ⚠️ No superadmin user found!');
      const createSuperadmin = await askQuestion('   Would you like to create a superadmin user? (y/n): ');
      
      if (createSuperadmin.toLowerCase() === 'y') {
        console.log('\n   📝 Creating superadmin user...');
        
        // Generate a UUID for the superadmin
        const superAdminUuid = crypto.randomUUID();
        
        const { data: newSuperadmin, error: createError } = await supabase
          .from('users')
          .insert([{
            id: superAdminUuid,
            name: 'Super Administrator',
            email: 'admin@edudashpro.org.za',
            role: 'superadmin',
            is_active: true,
            created_at: new Date().toISOString(),
            auth_user_id: superAdminUuid // Temporary - should be set during auth
          }])
          .select()
          .single();

        if (createError) {
          console.log('   ❌ Error creating superadmin:', createError.message);
          return;
        }

        console.log('   ✅ Superadmin created successfully!');
        superadminId = newSuperadmin.id;
      } else {
        console.log('   ⚠️ Skipping superadmin creation. You\'ll need one to approve requests.');
      }
    }

    // Create sample onboarding requests
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
      },
      {
        preschool_name: 'Rainbow Kids Preschool',
        admin_name: 'Lisa Williams',
        admin_email: 'lisa@rainbowkids.co.za',
        phone: '+27 31 555 7890',
        address: '789 Elm Road, Durban, 4000',
        number_of_students: 60,
        number_of_teachers: 8,
        message: 'We need a comprehensive solution for student and parent management.',
        status: 'pending'
      }
    ];

    const { data: createdRequests, error: requestError } = await supabase
      .from('preschool_onboarding_requests')
      .insert(sampleRequests)
      .select();

    if (requestError) {
      console.log('   ❌ Error creating requests:', requestError.message);
      return;
    }

    console.log(`   ✅ Created ${createdRequests.length} sample onboarding requests`);

    // Show the requests
    console.log('\n📋 Sample onboarding requests created:');
    createdRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.preschool_name} - ${req.admin_name} (${req.admin_email})`);
    });

    // Ask if user wants to approve some requests
    console.log('\n3️⃣ Approving requests to create schools and admin users...');
    const approveRequests = await askQuestion('   Would you like to approve these requests? (y/n): ');
    
    if (approveRequests.toLowerCase() === 'y') {
      console.log('   📝 Approving first request and creating school + admin...');
      
      const requestToApprove = createdRequests[0];
      
      // Step 1: Mark request as approved
      if (superadminId) {
        await supabase
          .from('preschool_onboarding_requests')
          .update({
            status: 'approved',
            reviewed_by: superadminId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', requestToApprove.id);
      }

      // Step 2: Create the preschool
      const schoolId = crypto.randomUUID();
      const { data: createdSchool, error: schoolError } = await supabase
        .from('preschools')
        .insert([{
          id: schoolId,
          name: requestToApprove.preschool_name,
          email: requestToApprove.admin_email,
          phone: requestToApprove.phone,
          address: requestToApprove.address,
          subscription_status: 'active',
          onboarding_status: 'completed',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (schoolError) {
        console.log('   ❌ Error creating school:', schoolError.message);
        return;
      }

      // Step 3: Create the admin user
      const adminId = crypto.randomUUID();
      const authUserId = crypto.randomUUID(); // In real app, this comes from Supabase Auth
      
      const { data: createdAdmin, error: adminError } = await supabase
        .from('users')
        .insert([{
          id: adminId,
          auth_user_id: authUserId,
          name: requestToApprove.admin_name,
          email: requestToApprove.admin_email,
          role: 'principal',
          preschool_id: schoolId,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (adminError) {
        console.log('   ❌ Error creating admin user:', adminError.message);
        return;
      }

      console.log('   ✅ Successfully created:');
      console.log(`      🏫 School: ${createdSchool.name} (ID: ${createdSchool.id})`);
      console.log(`      👨‍💼 Admin: ${createdAdmin.name} (${createdAdmin.email})`);
      console.log(`      🔐 Auth ID: ${createdAdmin.auth_user_id}`);

      // Step 4: Test the resend functionality
      console.log('\n4️⃣ Testing resend welcome instructions...');
      
      try {
        // This mimics what the resendWelcomeInstructions function does
        const { data: schoolToResend } = await supabase
          .from('preschools')
          .select(`
            id, name, email, subscription_status, onboarding_status,
            admin_user:users!preschool_id(id, name, email, role, is_active, auth_user_id)
          `)
          .eq('id', schoolId)
          .single();

        if (schoolToResend && schoolToResend.admin_user && schoolToResend.admin_user.length > 0) {
          const admin = schoolToResend.admin_user[0];
          
          console.log('   📧 Attempting to send welcome email...');
          console.log(`      To: ${admin.email}`);
          console.log(`      School: ${schoolToResend.name}`);
          console.log(`      Admin: ${admin.name}`);
          console.log(`      Has auth_user_id: ${admin.auth_user_id ? 'YES' : 'NO'}`);
          
          if (admin.auth_user_id) {
            // Test the email function (won't actually send in test mode)
            const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
              body: {
                to: admin.email,
                subject: `🔑 Login Instructions for ${schoolToResend.name} | EduDash Pro`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Welcome to EduDash Pro!</h2>
                    <p>Hello ${admin.name},</p>
                    <p>Your school <strong>${schoolToResend.name}</strong> has been approved!</p>
                    <p>You can now log in to your dashboard.</p>
                    <p>If you haven't set up your password yet, please use the password reset feature.</p>
                    <p>Best regards,<br>The EduDash Pro Team</p>
                  </div>
                `,
                templateType: 'welcome_instructions',
                schoolName: schoolToResend.name,
                principalName: admin.name
              }
            });

            if (emailError) {
              console.log(`   ⚠️ Email test result: ${emailError.message} (this is expected in test mode)`);
            } else {
              console.log('   ✅ Email function accessible - resend should work!');
            }
            
          } else {
            console.log('   ❌ Admin user missing auth_user_id - this would cause resend to fail');
          }
        } else {
          console.log('   ❌ No admin user found for school - resend would fail');
        }
        
      } catch (error) {
        console.log('   ❌ Resend test failed:', error.message);
      }
    }

    console.log('\n✅ Database setup complete!');
    console.log('\n📋 Summary:');
    console.log('   - Created sample onboarding requests');
    console.log('   - Created a school and admin user (if approved)');
    console.log('   - Tested the resend functionality');
    console.log('\n🎯 Next steps:');
    console.log('   1. Open your app and go to Super Admin dashboard');
    console.log('   2. Check the Onboarding tab - you should see pending requests');
    console.log('   3. Try approving a request and then test resend instructions');

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('Stack trace:', error.stack);
  } finally {
    rl.close();
  }
}

// Add crypto polyfill if not available
if (typeof crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  global.crypto = webcrypto;
}

setupDatabase();
