const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function quickSuperadminFix() {
  try {
    console.log('⚠️ NOTE: This script requires the RLS policies to be temporarily disabled in the Supabase dashboard.');
    console.log('Please go to Supabase Dashboard > Authentication > Policies and temporarily disable RLS on the users table.');
    console.log('Press any key to continue once RLS is disabled...');
    
    // Give user time to disable RLS manually
    console.log('Proceeding in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🚀 Step 1: Creating essential preschool data...');
    
    // Create preschool first
    const { data: preschoolData, error: preschoolError } = await supabase
      .from('preschools')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'EduDash Platform Administration',
        address: '123 Education Street, Cape Town, South Africa',
        phone: '+27-21-123-4567',
        email: 'admin@edudashpro.org.za',
        is_active: true
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (preschoolError) {
      console.log('⚠️ Preschool creation result:', preschoolError.message);
    } else {
      console.log('✅ Preschool created/updated');
    }
    
    console.log('👤 Step 2: Getting auth user ID...');
    
    // Get the auth user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    let authUserId = null;
    if (authData.user) {
      authUserId = authData.user.id;
      console.log('✅ Auth user ID found:', authUserId);
      await supabase.auth.signOut();
    } else {
      console.error('❌ Cannot find auth user. Creating new one...');
      const { data: newAuthData, error: newAuthError } = await supabase.auth.signUp({
        email: 'superadmin@edudashpro.org.za',
        password: '#Olivia@17'
      });
      
      if (newAuthError && !newAuthError.message.includes('already registered')) {
        console.error('❌ Failed to create auth user:', newAuthError.message);
        return;
      }
      
      authUserId = newAuthData.user?.id;
      console.log('✅ New auth user created:', authUserId);
    }
    
    console.log('📝 Step 3: Creating user profile (RLS should be disabled)...');
    
    // Clean up any existing superadmin records
    await supabase.from('users').delete().eq('email', 'superadmin@edudashpro.org.za');
    
    // Create the superadmin user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'superadmin@edudashpro.org.za',
        name: 'Super Admin',
        role: 'superadmin',
        auth_user_id: authUserId,
        preschool_id: '11111111-1111-1111-1111-111111111111',
        is_active: true,
        profile_completion_status: 'complete',
        phone: '+27-21-123-4567'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Error creating user profile:', userError.message);
      console.log('This likely means RLS is still enabled. Please disable it in Supabase dashboard.');
      return;
    }
    
    console.log('✅ Superadmin profile created successfully!');
    console.log('  - ID:', userData.id);
    console.log('  - Email:', userData.email);
    console.log('  - Role:', userData.role);
    console.log('  - Auth User ID:', userData.auth_user_id);
    
    console.log('🧪 Step 4: Testing the complete authentication flow...');
    
    // Test login and profile loading
    const { data: testAuth, error: testAuthError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    if (testAuthError) {
      console.error('❌ Login test failed:', testAuthError.message);
      return;
    }
    
    console.log('✅ Login successful!');
    
    const { data: profileTest, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', testAuth.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
    } else {
      console.log('✅ Profile loaded successfully:');
      console.log('  - Name:', profileTest.name);
      console.log('  - Role:', profileTest.role);
      console.log('  - Status:', profileTest.profile_completion_status);
    }
    
    await supabase.auth.signOut();
    
    console.log('\n🎉 SUPERADMIN CREATION SUCCESSFUL!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go back to Supabase Dashboard and RE-ENABLE RLS on the users table');
    console.log('2. The app should now work with proper authentication');
    console.log('\nCredentials to test:');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');
    console.log('\n🚀 Ready to continue with the rest of the fixes!');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

quickSuperadminFix();
