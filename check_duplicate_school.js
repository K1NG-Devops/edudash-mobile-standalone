const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const duplicateEmail = 'maybel@littlecherobeums.org.za';

async function checkDuplicateSchool() {
  try {
    console.log('🔍 [Check] Checking duplicate school record...');

    // Check if school exists
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .select('*')
      .eq('email', duplicateEmail)
      .single();

    if (schoolError) {
      console.error('❌ [Check] Error fetching school:', schoolError);
      return;
    }

    if (!school) {
      console.log('ℹ️ [Check] No school found with this email');
      return;
    }

    console.log('🏫 [Check] Found school record:');
    console.log(`   - ID: ${school.id}`);
    console.log(`   - Name: ${school.name}`);
    console.log(`   - Email: ${school.email}`);
    console.log(`   - Onboarding Status: ${school.onboarding_status}`);
    console.log(`   - Subscription Status: ${school.subscription_status}`);
    console.log(`   - Setup Completed: ${school.setup_completed}`);
    console.log(`   - Created: ${school.created_at}`);
    console.log(`   - Updated: ${school.updated_at}`);

    // Check if there's an associated user
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('preschool_id', school.id);

    if (userError) {
      console.error('❌ [Check] Error fetching users:', userError);
    } else {
      console.log(`\n👥 [Check] Found ${users.length} user(s) associated with this school:`);
      users.forEach((user, index) => {
        console.log(`   User ${index + 1}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Active: ${user.is_active}`);
        console.log(`   - Auth User ID: ${user.auth_user_id}`);
        console.log(`   - Profile Status: ${user.profile_completion_status}`);
        console.log('   ---');
      });
    }

    // Check if there are auth users without profiles
    if (users.length > 0) {
      for (const user of users) {
        if (user.auth_user_id) {
          try {
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.auth_user_id);
            if (authError) {
              console.log(`⚠️ [Check] Auth user ${user.auth_user_id} not found or error: ${authError.message}`);
            } else {
              console.log(`✅ [Check] Auth user ${user.auth_user_id} exists`);
            }
          } catch (authEx) {
            console.log(`⚠️ [Check] Auth user check failed: ${authEx.message}`);
          }
        }
      }
    }

    console.log('\n📋 [Check] Analysis:');
    if (school.onboarding_status === 'completed' && school.setup_completed && users.length > 0) {
      console.log('✅ School appears to be fully set up');
      console.log('💡 Recommendation: This school should not be recreated');
    } else if (school.onboarding_status !== 'completed' || !school.setup_completed) {
      console.log('⚠️ School setup is incomplete');
      console.log('💡 Recommendation: Complete the existing setup or clean up and restart');
    } else if (users.length === 0) {
      console.log('⚠️ School exists but has no users');
      console.log('💡 Recommendation: Create the missing admin user or clean up and restart');
    }

  } catch (error) {
    console.error('❌ [Check] Error:', error);
  }
}

async function cleanupIncompleteSchool() {
  try {
    console.log('🧹 [Cleanup] Starting cleanup of incomplete school...');

    // Get school record
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .select('*')
      .eq('email', duplicateEmail)
      .single();

    if (schoolError || !school) {
      console.log('ℹ️ [Cleanup] No school found to cleanup');
      return;
    }

    console.log(`🏫 [Cleanup] Found school: ${school.name} (${school.id})`);

    // Get associated users
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('preschool_id', school.id);

    if (!userError && users && users.length > 0) {
      console.log(`👥 [Cleanup] Deleting ${users.length} associated user(s)...`);
      
      // Delete auth users first (if they exist)
      for (const user of users) {
        if (user.auth_user_id) {
          try {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.auth_user_id);
            if (authDeleteError) {
              console.log(`⚠️ [Cleanup] Could not delete auth user ${user.auth_user_id}: ${authDeleteError.message}`);
            } else {
              console.log(`✅ [Cleanup] Deleted auth user ${user.auth_user_id}`);
            }
          } catch (authEx) {
            console.log(`⚠️ [Cleanup] Auth user deletion failed: ${authEx.message}`);
          }
        }
      }

      // Delete user profiles
      const { error: userDeleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('preschool_id', school.id);

      if (userDeleteError) {
        console.error('❌ [Cleanup] Error deleting user profiles:', userDeleteError);
      } else {
        console.log('✅ [Cleanup] Deleted user profiles');
      }
    }

    // Delete school record
    const { error: schoolDeleteError } = await supabaseAdmin
      .from('preschools')
      .delete()
      .eq('id', school.id);

    if (schoolDeleteError) {
      console.error('❌ [Cleanup] Error deleting school:', schoolDeleteError);
    } else {
      console.log('✅ [Cleanup] Deleted school record');
      console.log('🎉 [Cleanup] Cleanup completed successfully!');
      console.log('💡 [Cleanup] You can now retry the school creation process');
    }

  } catch (error) {
    console.error('❌ [Cleanup] Error during cleanup:', error);
  }
}

async function completeExistingSetup() {
  try {
    console.log('🔧 [Complete] Attempting to complete existing school setup...');

    // Get school record
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .select('*')
      .eq('email', duplicateEmail)
      .single();

    if (schoolError || !school) {
      console.log('ℹ️ [Complete] No school found');
      return;
    }

    console.log(`🏫 [Complete] Found school: ${school.name} (${school.id})`);

    // Check for existing users
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('preschool_id', school.id);

    if (userError) {
      console.error('❌ [Complete] Error fetching users:', userError);
      return;
    }

    if (users && users.length > 0) {
      console.log(`👥 [Complete] Found ${users.length} existing user(s)`);
      
      // Check if any user has principal/admin role
      const adminUser = users.find(u => ['principal', 'admin', 'preschool_admin'].includes(u.role));
      
      if (adminUser) {
        console.log(`✅ [Complete] Found admin user: ${adminUser.name} (${adminUser.role})`);
        
        // Update school to completed status
        const { error: updateError } = await supabaseAdmin
          .from('preschools')
          .update({
            onboarding_status: 'completed',
            setup_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', school.id);

        if (updateError) {
          console.error('❌ [Complete] Error updating school status:', updateError);
        } else {
          console.log('✅ [Complete] Updated school to completed status');
          console.log('🎉 [Complete] School setup completion successful!');
          
          // Generate and log a new temporary password for the admin
          const newPassword = `EduDash${Math.random().toString(36).slice(-8)}!`;
          
          if (adminUser.auth_user_id) {
            try {
              const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(adminUser.auth_user_id, {
                password: newPassword
              });

              if (passwordError) {
                console.error('⚠️ [Complete] Could not update password:', passwordError);
              } else {
                console.log('🔑 [Complete] Updated admin password');
                console.log(`📧 Admin Email: ${adminUser.email}`);
                console.log(`🔐 New Password: ${newPassword}`);
                console.log('💡 Please save these credentials and change the password after first login');
              }
            } catch (pwEx) {
              console.error('⚠️ [Complete] Password update failed:', pwEx.message);
            }
          }
        }
        
        return;
      }
    }

    // No admin user found, create one
    console.log('👤 [Complete] No admin user found, creating one...');
    
    const adminName = 'School Administrator';
    const adminEmail = school.email;
    const tempPassword = `EduDash${Math.random().toString(36).slice(-8)}!`;

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'principal',
        preschool_id: school.id
      }
    });

    if (authError) {
      console.error('❌ [Complete] Error creating auth user:', authError);
      return;
    }

    console.log('✅ [Complete] Created auth user');

    // Create user profile (manual fallback)
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authUser.user.id,
        email: adminEmail,
        name: adminName,
        role: 'principal',
        preschool_id: school.id,
        is_active: true,
        profile_completion_status: 'incomplete'
      });

    if (userInsertError) {
      console.error('❌ [Complete] Error creating user profile:', userInsertError);
      return;
    }

    console.log('✅ [Complete] Created user profile');

    // Update school status
    const { error: updateError } = await supabaseAdmin
      .from('preschools')
      .update({
        onboarding_status: 'completed',
        setup_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', school.id);

    if (updateError) {
      console.error('❌ [Complete] Error updating school status:', updateError);
    } else {
      console.log('✅ [Complete] Updated school to completed status');
      console.log('🎉 [Complete] School setup completion successful!');
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log(`🔐 Temp Password: ${tempPassword}`);
      console.log('💡 Please save these credentials and change the password after first login');
    }

  } catch (error) {
    console.error('❌ [Complete] Error during completion:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await checkDuplicateSchool();
      break;
    case 'cleanup':
      await cleanupIncompleteSchool();
      break;
    case 'complete':
      await completeExistingSetup();
      break;
    default:
      console.log('📋 [Usage] Available commands:');
      console.log('  node check_duplicate_school.js check   - Check current status');
      console.log('  node check_duplicate_school.js cleanup - Clean up incomplete school');
      console.log('  node check_duplicate_school.js complete - Complete existing setup');
      console.log('');
      console.log('🔍 Running check by default...');
      await checkDuplicateSchool();
  }
}

main();
