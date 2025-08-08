const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function completeSuperAdminSetup() {
  try {
    console.log('🔄 Step 1: Getting or creating auth user...');
    
    let authUserId = null;
    
    // Try to sign in first to see if user exists
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'superadmin@edudashpro.org.za',
        password: '#Olivia@17'
      });
      
      if (signInData.user && !signInError) {
        authUserId = signInData.user.id;
        console.log('✅ Existing auth user found:', authUserId);
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.log('ℹ️ No existing auth user, will create new one');
    }
    
    // If no existing user, create one
    if (!authUserId) {
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
        if (authError.message.includes('already registered')) {
          console.log('ℹ️ User already registered, trying to sign in...');
          const { data: existingUser } = await supabase.auth.signInWithPassword({
            email: 'superadmin@edudashpro.org.za',
            password: '#Olivia@17'
          });
          authUserId = existingUser.user?.id;
          await supabase.auth.signOut();
        } else {
          console.error('❌ Error creating auth user:', authError.message);
          return;
        }
      } else {
        authUserId = authData.user?.id;
        console.log('✅ New auth user created:', authUserId);
      }
    }
    
    if (!authUserId) {
      console.error('❌ Could not get auth user ID');
      return;
    }
    
    console.log('\\n🔄 Step 2: Updating user profile with correct auth_user_id...');
    
    // Update the placeholder user record with the correct auth_user_id
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: authUserId })
      .eq('email', 'superadmin@edudashpro.org.za')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating user profile:', updateError.message);
      
      // Try creating fresh if update failed
      console.log('🔄 Trying to create fresh user profile...');
      
      const { data: insertData, error: insertError } = await supabase
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
      
      if (insertError) {
        console.error('❌ Error inserting user profile:', insertError.message);
        return;
      }
      
      console.log('✅ Fresh user profile created');
    } else {
      console.log('✅ User profile updated successfully');
    }
    
    console.log('\\n🧪 Step 3: Testing complete authentication flow...');
    
    // Test the complete flow
    const { data: testAuthData, error: testAuthError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    if (testAuthError) {
      console.error('❌ Login test failed:', testAuthError.message);
      return;
    }
    
    console.log('✅ Authentication successful!');
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', testAuthData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
    } else {
      console.log('✅ Profile loaded successfully:');
      console.log('  - ID:', profileData.id);
      console.log('  - Name:', profileData.name);
      console.log('  - Email:', profileData.email);
      console.log('  - Role:', profileData.role);
      console.log('  - Active:', profileData.is_active);
      console.log('  - Profile Status:', profileData.profile_completion_status);
    }
    
    // Test preschool access
    const { data: preschoolData, error: preschoolError } = await supabase
      .from('preschools')
      .select('*')
      .limit(1);
    
    if (!preschoolError && preschoolData.length > 0) {
      console.log('✅ Preschool data accessible:', preschoolData[0].name);
    } else {
      console.log('⚠️ Preschool data access issue:', preschoolError?.message || 'No data');
    }
    
    await supabase.auth.signOut();
    console.log('✅ Test completed and signed out');
    
    console.log('\\n🎉 SUPERADMIN SETUP COMPLETED SUCCESSFULLY!');
    console.log('\\n📱 Ready to test the mobile app!');
    console.log('\\nCredentials:');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');
    console.log('\\nYou can now start the app with: npm start');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

completeSuperAdminSetup();
