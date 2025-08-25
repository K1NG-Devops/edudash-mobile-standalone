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
      return;
    }


    // Check if there's an associated user
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('preschool_id', school.id);

    if (userError) {
      console.error('❌ [Check] Error fetching users:', userError);
    } else {
      users.forEach((user, index) => {
      });
    }

    // Check if there are auth users without profiles
    if (users.length > 0) {
      for (const user of users) {
        if (user.auth_user_id) {
          try {
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.auth_user_id);
            if (authError) {
            } else {
            }
          } catch (authEx) {
          }
        }
      }
    }

    if (school.onboarding_status === 'completed' && school.setup_completed && users.length > 0) {
    } else if (school.onboarding_status !== 'completed' || !school.setup_completed) {
    } else if (users.length === 0) {
    }

  } catch (error) {
    console.error('❌ [Check] Error:', error);
  }
}

async function cleanupIncompleteSchool() {
  try {

    // Get school record
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .select('*')
      .eq('email', duplicateEmail)
      .single();

    if (schoolError || !school) {
      return;
    }


    // Get associated users
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('preschool_id', school.id);

    if (!userError && users && users.length > 0) {
      
      // Delete auth users first (if they exist)
      for (const user of users) {
        if (user.auth_user_id) {
          try {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.auth_user_id);
            if (authDeleteError) {
            } else {
            }
          } catch (authEx) {
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
    }

  } catch (error) {
    console.error('❌ [Cleanup] Error during cleanup:', error);
  }
}

async function completeExistingSetup() {
  try {

    // Get school record
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .select('*')
      .eq('email', duplicateEmail)
      .single();

    if (schoolError || !school) {
      return;
    }


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
      
      // Check if any user has principal/admin role
      const adminUser = users.find(u => ['principal', 'admin', 'preschool_admin'].includes(u.role));
      
      if (adminUser) {
        
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
      await checkDuplicateSchool();
  }
}

main();
