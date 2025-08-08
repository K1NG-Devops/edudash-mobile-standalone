const { createClient } = require('@supabase/supabase-js');

// Use your hardcoded values from supabase.ts
const supabaseUrl = 'https://lvvvjywrmpcqrpvuptdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8';

console.log('🔍 Verifying EduDash Mobile App Fixes...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFixes() {
  const results = {
    database: '❌',
    authentication: '❌',
    rls: '❌',
    dataAccess: '❌',
    overallStatus: 'FAILED'
  };

  try {
    console.log('\\n1️⃣ Testing Database Connectivity...');
    const { data: tablesTest, error: tablesError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (tablesError) {
      console.log('❌ Database access failed:', tablesError.message);
    } else {
      console.log('✅ Database connectivity successful');
      results.database = '✅';
    }

    console.log('\\n2️⃣ Testing Authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@edudashpro.org.za',
      password: '#Olivia@17'
    });
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else if (authData.user) {
      console.log('✅ Authentication successful');
      console.log('  - User ID:', authData.user.id);
      console.log('  - Email:', authData.user.email);
      results.authentication = '✅';
      
      console.log('\\n3️⃣ Testing Profile Loading (RLS)...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profile loading failed:', profileError.message);
        console.log('   This likely means RLS policies are blocking access');
      } else {
        console.log('✅ Profile loaded successfully');
        console.log('  - Name:', profileData.name);
        console.log('  - Role:', profileData.role);
        console.log('  - Status:', profileData.profile_completion_status);
        results.rls = '✅';
        
        console.log('\\n4️⃣ Testing Data Access...');
        const { data: preschoolData, error: preschoolError } = await supabase
          .from('preschools')
          .select('*')
          .limit(5);
        
        if (preschoolError) {
          console.log('❌ Preschool data access failed:', preschoolError.message);
        } else {
          console.log('✅ Preschool data accessible');
          console.log('  - Records found:', preschoolData.length);
          if (preschoolData.length > 0) {
            console.log('  - Sample:', preschoolData[0].name);
          }
          results.dataAccess = '✅';
        }
      }
      
      await supabase.auth.signOut();
      console.log('\\n✅ Signed out successfully');
    }

    // Determine overall status
    const allPassed = Object.values(results).slice(0, -1).every(status => status === '✅');
    results.overallStatus = allPassed ? 'PASSED' : 'PARTIAL';

    console.log('\\n' + '='.repeat(50));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Database Connectivity: ${results.database}`);
    console.log(`Authentication: ${results.authentication}`);
    console.log(`RLS Policies: ${results.rls}`);
    console.log(`Data Access: ${results.dataAccess}`);
    console.log('='.repeat(50));
    console.log(`Overall Status: ${results.overallStatus === 'PASSED' ? '🎉' : '⚠️'} ${results.overallStatus}`);
    console.log('='.repeat(50));

    if (results.overallStatus === 'PASSED') {
      console.log('\\n🎉 ALL SYSTEMS GO!');
      console.log('✅ Your EduDash Mobile App is ready for use!');
      console.log('\\n🚀 Next Steps:');
      console.log('1. Start the development server: npm start');
      console.log('2. Test on device/emulator');
      console.log('3. Login with: superadmin@edudashpro.org.za / #Olivia@17');
      console.log('4. Verify all role-based features work correctly');
    } else if (results.overallStatus === 'PARTIAL') {
      console.log('\\n⚠️ PARTIAL SUCCESS - Some issues remain');
      if (results.rls === '❌') {
        console.log('❗ RLS Issue: You need to manually run the SQL script in Supabase');
        console.log('   Go to: Supabase Dashboard > SQL Editor');
        console.log('   Run: MANUAL_SQL_FIX.sql');
      }
      if (results.dataAccess === '❌') {
        console.log('❗ Data Access Issue: Check RLS policies and permissions');
      }
    } else {
      console.log('\\n❌ CRITICAL ISSUES FOUND');
      console.log('Please check the errors above and fix before proceeding.');
    }

  } catch (error) {
    console.error('❌ Verification failed with exception:', error.message);
    results.overallStatus = 'FAILED';
  }

  return results;
}

verifyFixes();
