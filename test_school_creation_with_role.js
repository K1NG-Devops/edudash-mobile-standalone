const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function testSchoolCreationWithRole() {
  try {
    console.log('🧪 [Test] Testing school creation with role metadata...');

    const schoolData = {
      name: 'Test Principal Role School',
      email: `test-principal-${Date.now()}@example.com`,
      admin_name: 'Jane Principal',
      subscription_plan: 'trial'
    };

    console.log('📝 [Test] Creating school with data:', schoolData);

    // First, create the school record
    const { data: schoolRecord, error: schoolError } = await supabaseAdmin
      .from('preschools')
      .insert({
        name: schoolData.name,
        email: schoolData.email,
        subscription_plan: schoolData.subscription_plan || 'trial',
        subscription_status: 'active',
        tenant_slug: schoolData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        onboarding_status: 'completed',
        setup_completed: true
      })
      .select('*')
      .single();

    if (schoolError) {
      console.error('❌ [Test] Error creating school record:', schoolError);
      return;
    }

    console.log('✅ [Test] School record created:', schoolRecord.id);

    // Generate secure password
    const generateSecurePassword = () => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      const symbols = '!@#$%^&*';

      const password = [
        lowercase[Math.floor(Math.random() * lowercase.length)],
        uppercase[Math.floor(Math.random() * uppercase.length)],
        digits[Math.floor(Math.random() * digits.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      const allChars = lowercase + uppercase + digits + symbols;
      for (let i = 4; i < 12; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
      }

      return password.sort(() => Math.random() - 0.5).join('');
    };

    const tempPassword = generateSecurePassword();

    // Create auth user with role and preschool_id in metadata
    console.log('🔐 [Test] Creating auth user with role metadata...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: schoolData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: schoolData.admin_name,
        role: 'principal',
        preschool_id: schoolRecord.id
      }
    });

    if (authError) {
      console.error('❌ [Test] Error creating auth user:', authError);
      await supabaseAdmin.from('preschools').delete().eq('id', schoolRecord.id);
      return;
    }

    console.log('✅ [Test] Auth user created:', authUser.user?.id);
    
    const result = { success: true, school_id: schoolRecord.id, admin_email: schoolData.email };

    console.log('📋 [Test] School creation result:', result);

    if (result.success && result.school_id) {
      console.log('✅ [Test] School created successfully');
      
      // Wait a moment for triggers to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Query the database to check the user's role
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', schoolData.email)
        .single();
      
      if (userError) {
        console.error('❌ [Test] Error fetching created user:', userError);
        return;
      }
      
      console.log('👤 [Test] Created user data:', user);
      console.log(`📋 [Test] User role: ${user.role}`);
      console.log(`🏫 [Test] User preschool_id: ${user.preschool_id}`);
      
      if (user.role === 'principal') {
        console.log('🎉 [Test] SUCCESS: User was created with correct principal role!');
      } else {
        console.log(`❌ [Test] FAILURE: User was created with wrong role: ${user.role} (expected: principal)`);
      }
      
      if (user.preschool_id === result.school_id) {
        console.log('🎉 [Test] SUCCESS: User was linked to correct preschool!');
      } else {
        console.log(`❌ [Test] FAILURE: User linked to wrong preschool: ${user.preschool_id} (expected: ${result.school_id})`);
      }
      
    } else {
      console.error('❌ [Test] School creation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ [Test] Test failed with error:', error);
  }
}

testSchoolCreationWithRole();
