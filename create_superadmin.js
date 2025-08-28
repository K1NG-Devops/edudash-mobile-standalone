const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

console.log('🔗 Connecting to Supabase with admin privileges...');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createSuperAdmin() {
    try {
        console.log('🔧 Creating superadmin user...');

        // First, try to create the auth user using admin API
        let { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: 'superadmin@edudashpro.org.za',
            password: '#Olivia@17',
            email_confirm: true,
            user_metadata: {
                name: 'EduDash Super Administrator',
                role: 'superadmin'
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('✅ Auth user already exists, updating password...');

                // Get existing user
                const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) {
                    throw listError;
                }

                const existingUser = existingUsers.users.find(u => u.email === 'superadmin@edudashpro.org.za');
                if (!existingUser) {
                    throw new Error('User not found after listing');
                }

                // Update password
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                    password: '#Olivia@17',
                    email_confirm: true
                });

                if (updateError) {
                    throw updateError;
                }

                console.log('✅ Password updated for existing auth user');
                authUser = { user: existingUser };
            } else {
                throw authError;
            }
        } else {
            console.log('✅ Auth user created successfully');
        }

        console.log('📝 Auth user ID:', authUser.user.id);

        // Now create/update the profile in users table
        const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser.user.id)
            .maybeSingle();

        if (profileError) {
            console.log('⚠️ Error checking existing profile:', profileError.message);
        }

        if (existingProfile) {
            console.log('📝 Updating existing profile...');
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    role: 'superadmin',
                    name: 'EduDash Super Administrator',
                    is_active: true,
                    profile_completion_status: 'complete',
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingProfile.id);

            if (updateError) {
                throw updateError;
            }
            console.log('✅ Profile updated to superadmin');
        } else {
            console.log('� Creating new profile...');
            const { error: insertError } = await supabaseAdmin
                .from('users')
                .insert({
                    email: 'superadmin@edudashpro.org.za',
                    name: 'EduDash Super Administrator',
                    role: 'superadmin',
                    auth_user_id: authUser.user.id,
                    is_active: true,
                    profile_completion_status: 'complete'
                });

            if (insertError) {
                throw insertError;
            }
            console.log('✅ Profile created successfully');
        }

        // Verify the setup
        const { data: finalProfile, error: verifyError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser.user.id)
            .eq('role', 'superadmin')
            .single();

        if (verifyError) {
            throw verifyError;
        }

        console.log('🎉 Superadmin setup complete!');
        console.log('📧 Email: superadmin@edudashpro.org.za');
        console.log('🔑 Password: #Olivia@17');
        console.log('👤 Profile ID:', finalProfile.id);
        console.log('🔐 Auth ID:', finalProfile.auth_user_id);
        console.log('⭐ Role:', finalProfile.role);

    } catch (error) {
        console.error('❌ Error creating superadmin:', error);
        process.exit(1);
    }
}
try {
    console.log('👤 Creating superadmin auth user...');

    // Step 1: Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'superadmin@edudashpro.org.za',
        password: '#Olivia@17',
        options: {
            data: {
                name: 'Super Admin',
                role: 'superadmin'
            }
        }
    });

    if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        return;
    }

    if (!authData.user) {
        console.error('❌ No user data returned from auth signup');
        return;
    }

    console.log('✅ Auth user created with ID:', authData.user.id);

    // Step 2: Wait a moment for the auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Create the user profile in the users table
    console.log('📝 Creating user profile...');
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            email: 'superadmin@edudashpro.org.za',
            name: 'Super Admin',
            role: 'superadmin',
            auth_user_id: authData.user.id,
            is_active: true,
            profile_completion_status: 'complete'
        })
        .select()
        .single();

    if (userError) {
        console.error('❌ Error creating user profile:', userError.message);
        console.error('Error details:', userError);
        return;
    }

    console.log('✅ User profile created successfully:');
    console.log('  - ID:', userData.id);
    console.log('  - Email:', userData.email);
    console.log('  - Role:', userData.role);
    console.log('  - Auth User ID:', userData.auth_user_id);

    console.log('\\n🎉 SuperAdmin created successfully!');
    console.log('You can now sign in with:');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');

} catch (error) {
    console.error('❌ Exception:', error);
}
}

createSuperAdmin();
