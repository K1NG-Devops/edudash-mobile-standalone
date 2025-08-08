const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSuperAdminLogin() {
  try {
    console.log('🔍 Testing SuperAdmin login...');
    
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
    
    // Test profile loading
    console.log('🔍 Loading user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile loaded successfully:');
    console.log('  - ID:', profileData.id);
    console.log('  - Email:', profileData.email);
    console.log('  - Name:', profileData.name);
    console.log('  - Role:', profileData.role);
    console.log('  - Auth User ID:', profileData.auth_user_id);
    console.log('  - Is Active:', profileData.is_active);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('👋 Signed out successfully');
    
    console.log('\\n🎉 Everything is working perfectly!');
    console.log('Your SuperAdmin account is ready:');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testSuperAdminLogin();
