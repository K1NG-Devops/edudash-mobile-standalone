// Test script to verify supabaseAdmin client works
// Run this in your browser console to test

console.log('🧪 Testing Supabase Admin Client...');

// Check if admin client is available
if (window.supabaseAdmin) {
  console.log('✅ supabaseAdmin is available');
  
  // Test fetching superadmin users
  window.supabaseAdmin
    .from('users')
    .select('id, name, email, role')
    .eq('role', 'superadmin')
    .eq('is_active', true)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error fetching superadmins:', error);
      } else {
        console.log('✅ Found superadmins:', data);
        console.log(`📊 Total superadmins: ${data?.length || 0}`);
      }
    });
    
} else {
  console.log('❌ supabaseAdmin is not available');
  console.log('🔍 Check environment variables:');
  console.log('- EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', !!process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
}

// Test regular client for comparison
if (window.supabase) {
  console.log('✅ Regular supabase client is available');
  
  window.supabase
    .from('users')
    .select('id, name, email, role')
    .eq('role', 'superadmin')
    .eq('is_active', true)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error fetching superadmins with regular client:', error);
        console.log('ℹ️  This is expected due to RLS policies');
      } else {
        console.log('✅ Regular client found superadmins:', data);
      }
    });
} else {
  console.log('❌ Regular supabase client is not available');
}
