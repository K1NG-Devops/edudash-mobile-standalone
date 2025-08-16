const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugResendUserLookup() {
  console.log('🔍 Debugging Resend User Lookup Issue\n');

  try {
    // First, let's see what's in our onboarding_requests
    console.log('1️⃣ Checking onboarding_requests...');
    const { data: onboardingRequests, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .select('*');

    if (onboardingError) {
      console.error('❌ Error fetching onboarding requests:', onboardingError);
      return;
    }

    console.log(`   ✅ Found ${onboardingRequests.length} onboarding requests:`);
    onboardingRequests.forEach(req => {
      console.log(`      - ${req.admin_email} (${req.school_name}) - Status: ${req.status}`);
    });

    // Check what's in preschools table
    console.log('\n2️⃣ Checking preschools table...');
    const { data: preschools, error: preschoolsError } = await supabase
      .from('preschools')
      .select('*');

    if (preschoolsError) {
      console.error('❌ Error fetching preschools:', preschoolsError);
    } else {
      console.log(`   ✅ Found ${preschools.length} preschools:`);
      preschools.forEach(school => {
        console.log(`      - ${school.name} (${school.email}) - ID: ${school.id}`);
      });
    }

    // Check what's in users table
    console.log('\n3️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`   ✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`      - ${user.email} (${user.name}) - Role: ${user.role}, Preschool ID: ${user.preschool_id}`);
      });
    }

    // Now let's simulate what the resend function is trying to do
    console.log('\n4️⃣ Simulating resend lookup...');
    
    // The resend function looks for a preschool by ID, then finds its admin
    // Let's find a preschool that should have an admin
    const targetEmail = 'elsha@youngeagles.org.za'; // From the email screenshot
    
    console.log(`   🔍 Looking for preschool admin: ${targetEmail}`);
    
    // First, let's see if there's a user with this email
    const userWithEmail = users?.find(u => u.email === targetEmail);
    if (userWithEmail) {
      console.log(`   ✅ Found user: ${userWithEmail.name}, Role: ${userWithEmail.role}, Preschool ID: ${userWithEmail.preschool_id}`);
      
      if (userWithEmail.preschool_id) {
        // Find the preschool
        const userPreschool = preschools?.find(p => p.id === userWithEmail.preschool_id);
        if (userPreschool) {
          console.log(`   ✅ User belongs to preschool: ${userPreschool.name}`);
        } else {
          console.log(`   ❌ User's preschool not found (ID: ${userWithEmail.preschool_id})`);
        }
      } else {
        console.log(`   ❌ User has no preschool_id`);
      }
      
      if (userWithEmail.auth_user_id) {
        console.log(`   ✅ User has auth_user_id: ${userWithEmail.auth_user_id}`);
      } else {
        console.log(`   ❌ User missing auth_user_id - this will cause password update to fail`);
      }
    } else {
      console.log(`   ❌ No user found with email: ${targetEmail}`);
    }

    // Let's also check if there are any schools table entries
    console.log('\n5️⃣ Checking if schools table exists...');
    try {
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('*');

      if (schoolsError) {
        console.log('   ❌ Schools table does not exist or is not accessible');
      } else {
        console.log(`   ✅ Schools table exists with ${schools.length} entries`);
        schools.forEach(school => {
          console.log(`      - ${school.name} (${school.email})`);
        });
      }
    } catch (err) {
      console.log('   ❌ Schools table does not exist');
    }

    // Check admin_users table
    console.log('\n6️⃣ Checking if admin_users table exists...');
    try {
      const { data: adminUsers, error: adminUsersError } = await supabase
        .from('admin_users')
        .select('*');

      if (adminUsersError) {
        console.log('   ❌ Admin_users table does not exist or is not accessible');
      } else {
        console.log(`   ✅ Admin_users table exists with ${adminUsers.length} entries`);
        adminUsers.forEach(admin => {
          console.log(`      - ${admin.email} (${admin.first_name} ${admin.last_name}) - Role: ${admin.role}`);
        });
      }
    } catch (err) {
      console.log('   ❌ Admin_users table does not exist');
    }

    console.log('\n💡 DIAGNOSIS:');
    console.log('================');
    
    if (userWithEmail && userWithEmail.auth_user_id) {
      console.log('✅ User lookup should work - user has auth_user_id');
      console.log('💡 The issue might be in the password generation or email template');
    } else if (userWithEmail && !userWithEmail.auth_user_id) {
      console.log('❌ Password update will fail - user missing auth_user_id');
      console.log('💡 Need to create proper auth user for this admin');
    } else {
      console.log('❌ User lookup will fail - no user found with the email');
      console.log('💡 Need to create user record for this admin');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugResendUserLookup();
