#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStatus() {
  console.log('🔍 EduDash Pro Database Status Check');
  console.log('=====================================\n');
  
  console.log('📊 Connection Info:');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Project ID: ${supabaseUrl.split('//')[1].split('.')[0]}`);
  console.log('');

  try {
    // Check authentication
    console.log('🔐 Authentication Status:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (user) {
      console.log(`✅ Authenticated as: ${user.email}`);
      console.log(`User ID: ${user.id}`);
    } else {
      console.log('ℹ️  Not currently authenticated (this is normal)');
    }
    console.log('');

    // Check tables existence
    console.log('📋 Database Tables:');
    
    // Check users table
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) {
      if (usersError.code === 'PGRST116' || usersError.code === '42P01') {
        console.log('❌ users table: Does not exist or no access');
      } else {
        console.log(`❌ users table: Error - ${usersError.message}`);
      }
    } else {
      console.log(`✅ users table: ${usersCount || 0} records`);
    }

    // Check preschools table
    const { data: preschools, error: preschoolsError } = await supabase
      .from('preschools')
      .select('count', { count: 'exact', head: true });
    
    if (preschoolsError) {
      if (preschoolsError.code === 'PGRST116') {
        console.log('❌ preschools table: Does not exist or no access');
      } else {
        console.log(`❌ preschools table: Error - ${preschoolsError.message}`);
      }
    } else {
      console.log(`✅ preschools table: ${preschools.length || 0} records`);
    }

    // Check students table
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true });
    
    if (studentsError) {
      if (studentsError.code === 'PGRST116') {
        console.log('❌ students table: Does not exist or no access');
      } else {
        console.log(`❌ students table: Error - ${studentsError.message}`);
      }
    } else {
      console.log(`✅ students table: ${students.length || 0} records`);
    }

    // Check lessons table
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('count', { count: 'exact', head: true });
    
    if (lessonsError) {
      if (lessonsError.code === 'PGRST116') {
        console.log('❌ lessons table: Does not exist or no access');
      } else {
        console.log(`❌ lessons table: Error - ${lessonsError.message}`);
      }
    } else {
      console.log(`✅ lessons table: ${lessons.length || 0} records`);
    }

    console.log('');

    // Check RLS status (if we can)
    console.log('🔒 Security Status:');
    try {
      // Try to check if we have any users (this will tell us about RLS)
      const { data: testUsers, error: rlsError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(3);

      if (rlsError) {
        console.log(`⚠️  RLS Status: ${rlsError.message}`);
      } else {
        console.log(`✅ Can access users table: ${testUsers.length} users visible`);
        if (testUsers.length > 0) {
          console.log('   Sample users:');
          testUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.role || 'no role'})`);
          });
        }
      }
    } catch (error) {
      console.log(`⚠️  RLS Check: ${error.message}`);
    }

    console.log('');

    // Database URL components
    console.log('🔗 Connection Details:');
    const urlParts = new URL(supabaseUrl);
    console.log(`Host: ${urlParts.hostname}`);
    console.log(`Protocol: ${urlParts.protocol}`);
    console.log('');

    // Next steps
    console.log('📝 Next Steps:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log(`2. Find project: ${urlParts.hostname.split('.')[0]}`);
    console.log('3. Navigate to: Database > Tables');
    console.log('4. Use SQL Editor for advanced queries');
    console.log('');
    console.log('🔧 To run RLS migration:');
    console.log('1. Copy contents of: supabase/migrations/20250806_secure_rls_policies.sql');
    console.log('2. Paste in: Database > SQL Editor');
    console.log('3. Click "Run"');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🚨 This might be a connection issue.');
      console.log('Check your internet connection and Supabase URL.');
    }
  }
}

// Run the check
checkDatabaseStatus().then(() => {
  console.log('\n✨ Database check completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
