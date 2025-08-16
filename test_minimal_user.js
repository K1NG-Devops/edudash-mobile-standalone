const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function testMinimalUserCreation() {
  try {
    console.log('🧪 [Test] Testing user creation with MINIMAL metadata...');

    const testEmail = `test-minimal-${Date.now()}@example.com`;
    const tempPassword = 'TempPass123!';

    console.log('📝 [Test] Creating user with email:', testEmail);

    // Test 1: Create user with absolutely minimal metadata (only name)
    console.log('🔐 [Test] Testing with only name in metadata...');
    
    const { data: authUser1, error: authError1 } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Minimal Test User'
      }
    });

    if (authError1) {
      console.error('❌ [Test] Error creating user with minimal metadata:', authError1);
      
      // Try with NO metadata at all
      console.log('🔐 [Test] Trying with NO metadata...');
      const testEmail2 = `test-no-metadata-${Date.now()}@example.com`;
      
      const { data: authUser2, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail2,
        password: tempPassword,
        email_confirm: true
      });

      if (authError2) {
        console.error('❌ [Test] Error creating user with NO metadata:', authError2);
        console.log('🚨 [Test] The trigger function has a fundamental issue!');
        return;
      } else {
        console.log('✅ [Test] User created with NO metadata:', authUser2.user?.id);
      }
    } else {
      console.log('✅ [Test] User created with minimal metadata:', authUser1.user?.id);
      
      // Check what the trigger created
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser1.user.id)
        .single();
      
      if (userError) {
        console.error('❌ [Test] Error fetching user profile:', userError);
      } else {
        console.log('👤 [Test] Created user profile:', user);
        console.log(`📋 [Test] Role: ${user.role}`);
        console.log(`🏫 [Test] Preschool ID: ${user.preschool_id}`);
        
        // Now test adding role metadata step by step
        console.log('🔐 [Test] Testing with role metadata...');
        
        const testEmail3 = `test-role-${Date.now()}@example.com`;
        
        const { data: authUser3, error: authError3 } = await supabaseAdmin.auth.admin.createUser({
          email: testEmail3,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: 'Role Test User',
            role: 'admin'
          }
        });

        if (authError3) {
          console.error('❌ [Test] Error creating user with role metadata:', authError3);
          console.log('🔍 [Test] The issue is specifically with the role metadata');
        } else {
          console.log('✅ [Test] User created with role metadata:', authUser3.user?.id);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: user3, error: userError3 } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser3.user.id)
            .single();
          
          if (userError3) {
            console.error('❌ [Test] Error fetching role user profile:', userError3);
          } else {
            console.log('👤 [Test] Role user profile:', user3);
            console.log(`📋 [Test] Role: ${user3.role} (expected: admin)`);
            
            if (user3.role === 'admin') {
              console.log('🎉 [Test] SUCCESS: Role metadata is working!');
            } else {
              console.log(`❌ [Test] Role metadata not applied correctly`);
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ [Test] Test failed with error:', error);
  }
}

testMinimalUserCreation();
