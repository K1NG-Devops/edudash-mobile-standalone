const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAuthUserIdMismatch() {
  try {
    console.log('1️⃣ Logging in to get current auth user ID...');
    
    // Login to get the current auth user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }
    
    const currentAuthUserId = authData.user.id;
    console.log('✅ Current auth user ID:', currentAuthUserId);
    
    console.log('\\n2️⃣ Checking existing users table...');
    
    // Check what's in the users table
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log('Found', allUsers.length, 'users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (Auth ID: ${user.auth_user_id})`);
    });
    
    console.log('\\n3️⃣ Updating or creating superadmin user with correct auth_user_id...');
    
    // Delete any existing superadmin users first
    await supabase
      .from('users')
      .delete()
      .eq('email', 'superadmin@edudashpro.org.za');
    
    // Insert new superadmin user with correct auth_user_id
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: 'superadmin@edudashpro.org.za',
        name: 'Super Admin',
        role: 'superadmin',
        auth_user_id: currentAuthUserId,
        is_active: true,
        profile_completion_status: 'complete'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating user:', insertError.message);
      return;
    }
    
    console.log('✅ Superadmin user created/updated successfully:');
    console.log('  - ID:', newUser.id);
    console.log('  - Email:', newUser.email);
    console.log('  - Role:', newUser.role);
    console.log('  - Auth User ID:', newUser.auth_user_id);
    
    console.log('\\n4️⃣ Testing profile loading...');
    
    // Test profile loading
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', currentAuthUserId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading still failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile loading successful!');
    console.log('  - Name:', profileData.name);
    console.log('  - Role:', profileData.role);
    
    // Sign out
    await supabase.auth.signOut();
    
    console.log('\\n🎉 SUCCESS! The auth_user_id mismatch has been fixed.');
    console.log('Now try logging in at: http://localhost:8082');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');
    console.log('\\nYou should now see the SuperAdmin dashboard!');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

fixAuthUserIdMismatch();
