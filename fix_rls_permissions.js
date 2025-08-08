const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      console.error('SQL execution error:', error);
      return false;
    }
    
    console.log('SQL executed successfully:', data);
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

async function fixTeacherCreationRLS() {
  console.log('🔧 Fixing RLS policies for teacher creation...');
  
  // The SQL to fix teacher creation permissions
  const sql = `
    -- Add RLS policy to allow preschool admins to create teachers
    CREATE POLICY "preschool_admins_can_create_teachers" ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- Allow if user is creating a teacher for their own preschool and they are an admin/principal
        role = 'teacher' AND 
        preschool_id IN (
          SELECT u.preschool_id 
          FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role IN ('admin', 'principal', 'preschool_admin')
        )
      );

    -- Add a policy that allows preschool users to view other users in their preschool
    CREATE POLICY "users_can_view_preschool_members" ON public.users
      FOR SELECT 
      TO authenticated
      USING (
        -- Users can see other users in their preschool
        preschool_id IN (
          SELECT u.preschool_id 
          FROM public.users u 
          WHERE u.auth_user_id = auth.uid()
        )
        OR
        -- Superadmins can see everything
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role = 'superadmin'
        )
      );

    -- Add a policy that allows preschool admins to update teachers in their preschool
    CREATE POLICY "preschool_admins_can_update_teachers" ON public.users
      FOR UPDATE
      TO authenticated
      USING (
        -- Allow if updating a teacher in their own preschool and they are an admin/principal
        role = 'teacher' AND 
        preschool_id IN (
          SELECT u.preschool_id 
          FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role IN ('admin', 'principal', 'preschool_admin')
        )
      );
  `;

  const success = await executeSQL(sql);
  
  if (success) {
    console.log('✅ Successfully updated RLS policies for teacher creation!');
    console.log('🎉 Preschool admins can now create teachers for their preschool.');
  } else {
    console.log('❌ Failed to update RLS policies. This might require manual intervention.');
    console.log('📝 You can copy the SQL from the migration file and run it in Supabase dashboard.');
  }
  
  return success;
}

// Since the rpc function likely doesn't exist, let's try an alternative approach
async function alternativeApproach() {
  console.log('🔍 Checking current user and permissions...');
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found. You need to be logged in to apply RLS policies.');
      console.log('💡 Try logging into your app first, then run this script again.');
      return false;
    }
    
    console.log('✅ Found authenticated user:', user.email);
    
    // Check current user's profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, preschool_id, name')
      .eq('auth_user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return false;
    }
    
    console.log('✅ User profile:', profile);
    
    if (!['admin', 'principal', 'preschool_admin', 'superadmin'].includes(profile.role)) {
      console.log('❌ Current user does not have admin privileges to modify RLS policies.');
      console.log('💡 You need to be logged in as a preschool admin or superadmin.');
      return false;
    }
    
    console.log('✅ User has admin privileges. Ready to test teacher creation.');
    
    // Test if we can see other users in the preschool
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('preschool_id', profile.preschool_id)
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching preschool users:', usersError);
      return false;
    }
    
    console.log('✅ Can access preschool users:', users.length, 'users found');
    
    console.log('\n📋 Summary:');
    console.log('- Authenticated user:', user.email);
    console.log('- User role:', profile.role);
    console.log('- Preschool ID:', profile.preschool_id);
    console.log('- Can view preschool users:', users.length > 0 ? 'Yes' : 'No');
    
    console.log('\n🔧 RLS Policy Fix Required:');
    console.log('The teacher creation is failing because the current RLS policies don\'t allow');
    console.log('preschool admins to create teacher records. This requires manual intervention');
    console.log('in the Supabase dashboard or using service role credentials.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in alternative approach:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RLS Policy Fix for Teacher Creation...\n');
  
  // Since we don't have service role access, let's try the alternative approach
  const success = await alternativeApproach();
  
  if (!success) {
    console.log('\n📖 Manual Fix Instructions:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to your EduDash-Pro project');
    console.log('3. Go to Database > Tables > users > Settings > Row Level Security');
    console.log('4. Add the following policies manually:');
    console.log('\nPolicy 1: preschool_admins_can_create_teachers');
    console.log('Policy 2: users_can_view_preschool_members');  
    console.log('Policy 3: preschool_admins_can_update_teachers');
    console.log('\n5. Or copy the SQL from: supabase/migrations/20250806_fix_teacher_creation_rls.sql');
  }
}

main().then(() => {
  console.log('\n🏁 Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
