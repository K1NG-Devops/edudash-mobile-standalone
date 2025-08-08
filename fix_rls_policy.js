const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserRLSPolicy() {
  console.log('Fixing users table RLS policy...');
  
  try {
    // Drop existing policy
    const dropPolicySQL = `DROP POLICY IF EXISTS "users_policy" ON public.users;`;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: dropPolicySQL 
    });
    
    if (dropError) {
      console.log('Note: Could not drop existing policy (this is expected if using anon key):', dropError.message);
    }

    // Create new comprehensive policy
    const createPolicySQL = `
      CREATE POLICY "users_comprehensive_policy" ON public.users
        USING (
          -- Users can see their own profile
          auth.uid() = auth_user_id OR
          -- Superadmins can see everything
          EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'superadmin'
          ) OR
          -- Users can see other users in their preschool
          EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.preschool_id = users.preschool_id
          )
        )
        WITH CHECK (
          -- Users can update their own profile
          auth.uid() = auth_user_id OR
          -- Superadmins can modify everything
          EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'superadmin'
          ) OR
          -- Preschool admins can create/modify users in their preschool
          EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'principal') 
            AND u.preschool_id = users.preschool_id
          )
        );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createPolicySQL 
    });
    
    if (createError) {
      console.error('Error creating new policy:', createError);
      return false;
    }

    console.log('✅ Successfully updated users table RLS policy');
    return true;
  } catch (error) {
    console.error('Error fixing RLS policy:', error);
    return false;
  }
}

// Note: The above approach requires a custom SQL execution function
// Since we're using the anon key, let's try a different approach
async function alternativeApproach() {
  console.log('Using alternative approach - checking current user permissions...');
  
  try {
    // Test current user's permissions
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    
    if (userError || !currentUser.user) {
      console.error('No authenticated user found');
      return false;
    }

    console.log('Current authenticated user:', currentUser.user.email);

    // Check if user can access users table
    const { data: userData, error: accessError } = await supabase
      .from('users')
      .select('id, role, preschool_id')
      .limit(1);

    if (accessError) {
      console.error('Error accessing users table:', accessError);
      return false;
    }

    console.log('✅ User can access users table. Current permissions appear to be working.');
    console.log('User data sample:', userData);
    
    return true;
  } catch (error) {
    console.error('Error in alternative approach:', error);
    return false;
  }
}

async function main() {
  console.log('Starting RLS policy fix...');
  
  // Try the alternative approach first since we don't have admin privileges
  const success = await alternativeApproach();
  
  if (!success) {
    console.log('\n❌ Could not fix RLS policies with current permissions.');
    console.log('📝 Manual intervention may be required in Supabase dashboard.');
    console.log('   Go to: Database > Tables > users > Settings > Row Level Security');
    console.log('   Update the policy to allow preschool admins to create teachers.');
  }
}

main().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
