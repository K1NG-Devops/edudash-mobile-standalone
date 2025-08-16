/**
 * Debug script to test Supabase admin client functionality
 * Run in browser console to test service role client
 */

async function debugAdminClient() {
  console.log('🔧 [Debug] Starting admin client tests...');
  
  try {
    // Import the clients (this will work in browser console when app is loaded)
    const { supabase, supabaseAdmin } = window.supabaseClients || {};
    
    if (!supabaseAdmin) {
      console.error('❌ [Debug] supabaseAdmin is not available');
      return;
    }
    
    console.log('✅ [Debug] supabaseAdmin client is available');
    
    // Test 1: Try to create a test school with admin client
    console.log('🧪 [Debug] Test 1: Creating test school...');
    const { data: testSchool, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .insert({
        name: 'Debug Test School',
        email: 'debug@test.com',
        subscription_plan: 'trial',
        subscription_status: 'active',
        tenant_slug: 'debug-test-school',
        onboarding_status: 'completed',
        setup_completed: true
      })
      .select('*')
      .single();
    
    if (schoolError) {
      console.error('❌ [Debug] School creation failed:', schoolError);
      return;
    }
    
    console.log('✅ [Debug] Test school created:', testSchool.id);
    
    // Test 2: Try to create auth user with admin client
    console.log('🧪 [Debug] Test 2: Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'debug@test.com',
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        name: 'Debug User',
        role: 'principal',
        preschool_id: testSchool.id,
        school_name: 'Debug Test School'
      }
    });
    
    if (authError) {
      console.error('❌ [Debug] Auth user creation failed:', authError);
      // Cleanup school
      await supabaseAdmin.from('preschools').delete().eq('id', testSchool.id);
      return;
    }
    
    console.log('✅ [Debug] Auth user created:', authUser.user?.id);
    
    // Test 3: Try to create user profile with admin client
    console.log('🧪 [Debug] Test 3: Creating user profile...');
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authUser.user.id,
        email: 'debug@test.com',
        name: 'Debug User',
        role: 'principal',
        preschool_id: testSchool.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (profileError) {
      console.error('❌ [Debug] User profile creation failed:', profileError);
    } else {
      console.log('✅ [Debug] User profile created:', userProfile.id);
    }
    
    // Cleanup
    console.log('🧹 [Debug] Cleaning up test data...');
    if (userProfile) {
      await supabaseAdmin.from('users').delete().eq('id', userProfile.id);
    }
    if (authUser?.user) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    }
    await supabaseAdmin.from('preschools').delete().eq('id', testSchool.id);
    
    console.log('✅ [Debug] All tests completed successfully!');
    
  } catch (error) {
    console.error('💥 [Debug] Test failed with exception:', error);
  }
}

// Make function available globally
window.debugAdminClient = debugAdminClient;

// Also expose the clients for debugging
if (typeof window !== 'undefined' && !window.supabaseClients) {
  // This will be set by the actual app
  console.log('🔧 [Debug] Waiting for supabase clients to be available...');
}

console.log('🔧 [Debug] Debug script loaded. Run debugAdminClient() to test admin client functionality.');
