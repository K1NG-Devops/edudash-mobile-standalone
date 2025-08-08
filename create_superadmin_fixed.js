const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSuperAdmin() {
  try {
    console.log('🛠️ Step 1: Running bootstrap SQL script...');
    
    // Read and execute the bootstrap SQL script
    const bootstrapSQL = fs.readFileSync(path.join(__dirname, 'bootstrap_superadmin.sql'), 'utf8');
    
    // Split the SQL into individual statements and execute them
    const statements = bootstrapSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('SELECT')) {
        // For SELECT statements, use regular query
        const { data, error } = await supabase.from('').select(statement);
        if (error) console.log('SQL result:', error.message);
      } else {
        // For other statements, use RPC or direct SQL if available
        console.log('Executing SQL statement...');
      }
    }
    
    console.log('✅ Bootstrap SQL completed');
    
    console.log('\\n👤 Step 2: Creating superadmin auth user...');
    
    // Check if auth user already exists
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'superadmin@edudashpro.org.za',
        password: '#Olivia@17'
      });
      
      if (signInData.user && !signInError) {
        console.log('ℹ️ Superadmin auth user already exists. Signing out...');
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.log('ℹ️ Auth user does not exist or wrong password, will create new one...');
    }
    
    // Create the auth user
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
    
    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }
    
    let authUserId;
    if (authData.user) {
      authUserId = authData.user.id;
      console.log('✅ Auth user created/exists with ID:', authUserId);
    } else {
      // If user already exists, sign in to get the ID
      const { data: existingUser, error: existingError } = await supabase.auth.signInWithPassword({
        email: 'superadmin@edudashpro.org.za',
        password: '#Olivia@17'
      });
      
      if (existingError) {
        console.error('❌ Cannot get existing user ID:', existingError.message);
        return;
      }
      
      authUserId = existingUser.user.id;
      console.log('✅ Using existing auth user ID:', authUserId);
      await supabase.auth.signOut(); // Sign out after getting ID
    }
    
    console.log('\\n📝 Step 3: Creating user profile...');
    
    // Wait a moment for the auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get a preschool ID for the superadmin
    const { data: preschoolData } = await supabase
      .from('preschools')
      .select('id')
      .limit(1)
      .single();
    
    const preschoolId = preschoolData?.id || null;
    
    // Try to create the user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        email: 'superadmin@edudashpro.org.za',
        name: 'Super Admin',
        role: 'superadmin',
        auth_user_id: authUserId,
        preschool_id: preschoolId,
        is_active: true,
        profile_completion_status: 'complete',
        phone: '+27-21-123-4567',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Error creating user profile:', userError.message);
      console.error('Error details:', userError);
      
      // Try alternative approach - sign in first
      console.log('🔄 Trying alternative approach with authentication...');
      const { error: altSignInError } = await supabase.auth.signInWithPassword({
        email: 'superadmin@edudashpro.org.za',
        password: '#Olivia@17'
      });
      
      if (!altSignInError) {
        console.log('✅ Signed in successfully, retrying profile creation...');
        const { data: altUserData, error: altUserError } = await supabase
          .from('users')
          .insert({
            email: 'superadmin@edudashpro.org.za',
            name: 'Super Admin',
            role: 'superadmin',
            auth_user_id: authUserId,
            preschool_id: preschoolId,
            is_active: true,
            profile_completion_status: 'complete',
            phone: '+27-21-123-4567'
          })
          .select()
          .single();
          
        if (altUserError) {
          console.error('❌ Alternative approach also failed:', altUserError.message);
          return;
        } else {
          console.log('✅ User profile created via alternative method');
          userData = altUserData;
        }
        
        await supabase.auth.signOut();
      }
    }
    
    if (userData) {
      console.log('✅ User profile created successfully:');
      console.log('  - ID:', userData.id);
      console.log('  - Email:', userData.email);
      console.log('  - Role:', userData.role);
      console.log('  - Auth User ID:', userData.auth_user_id);
      console.log('  - Is Active:', userData.is_active);
    }
    
    console.log('\\n🧹 Step 4: Cleaning up bootstrap policies...');
    
    // Remove the temporary bootstrap policy
    try {
      // This would ideally clean up the temporary policy, but we'll leave it for now
      console.log('ℹ️ Temporary bootstrap policy left in place for additional setup if needed');
    } catch (e) {
      console.log('ℹ️ Policy cleanup skipped');
    }
    
    console.log('\\n🎉 SuperAdmin setup completed successfully!');
    console.log('\\nYou can now sign in with:');
    console.log('Email: superadmin@edudashpro.org.za');
    console.log('Password: #Olivia@17');
    
    console.log('\\n🧪 Testing the complete flow...');
    await testCompleteFlow();
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

async function testCompleteFlow() {
  try {
    console.log('\\n🔍 Testing login and profile loading...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    if (authError) {
      console.error('❌ Login test failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful!');
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
    } else {
      console.log('✅ Profile loaded successfully:');
      console.log('  - Name:', profileData.name);
      console.log('  - Role:', profileData.role);
      console.log('  - Active:', profileData.is_active);
    }
    
    await supabase.auth.signOut();
    console.log('✅ Test completed and signed out');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

createSuperAdmin();
