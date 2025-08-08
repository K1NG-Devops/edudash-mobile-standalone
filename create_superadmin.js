const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSuperAdmin() {
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
