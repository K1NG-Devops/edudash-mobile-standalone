const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteFlow() {
  try {
    console.log('1️⃣ Testing database access...');
    
    // Test if users table exists and has data
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, auth_user_id')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      return;
    }
    
    console.log('✅ Users table accessible. Found', usersData.length, 'users');
    usersData.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Auth ID: ${user.auth_user_id}`);
    });
    
    console.log('\\n2️⃣ Testing SuperAdmin login...');
    
    // Test login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful! Auth User ID:', authData.user.id);
    
    console.log('\\n3️⃣ Testing profile loading...');
    
    // Test profile loading
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
      await supabase.auth.signOut();
      return;
    }
    
    console.log('✅ Profile loaded successfully:');
    console.log('  - ID:', profileData.id);
    console.log('  - Email:', profileData.email);
    console.log('  - Name:', profileData.name);
    console.log('  - Role:', profileData.role);
    console.log('  - Auth User ID:', profileData.auth_user_id);
    console.log('  - Is Active:', profileData.is_active);
    console.log('  - Profile Status:', profileData.profile_completion_status);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\\n4️⃣ Signed out successfully');
    
    console.log('\\n🎉 ALL TESTS PASSED! Your setup is working correctly.');
    console.log('\\nNow try logging in at: http://localhost:8082');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');
    console.log('\\nYou should see the SuperAdmin dashboard instead of the parent fallback!');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testCompleteFlow();
