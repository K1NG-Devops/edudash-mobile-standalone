#!/usr/bin/env node

/**
 * Database diagnostic script to check current state of EduDash Pro database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create both regular and service role clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Expected tables from the database types
const expectedTables = [
  'users',
  'preschools', 
  'students',
  'classes',
  'age_groups',
  'lessons',
  'lesson_categories',
  'activities',
  'homework_assignments',
  'homework_submissions',
  'classroom_reports',
  'messages',
  'message_recipients',
  'message_notifications',
  'message_drafts',
  'invitation_codes',
  'parent_access_codes',
  'school_invitation_codes',
  'student_registrations',
  'emergency_contacts',
  'events',
  'payment_fees',
  'payment_methods',
  'payments',
  'payment_receipts',
  'media_uploads',
  'user_preferences',
  'video_call_sessions',
  'class_assignments',
  'addresses',
  'preschool_onboarding_requests'
];

async function checkTableExists(tableName) {
  try {
    // Try to query the table
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { exists: false, error: 'Table does not exist' };
      }
      return { exists: true, error: error.message };
    }
    
    return { exists: true, error: null, recordCount: data?.length || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkRLSPolicies() {
  try {
    // Check if we can query users table with regular client
    const { data: regularData, error: regularError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    // Check with admin client
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    return {
      regularClient: { 
        works: !regularError, 
        error: regularError?.message 
      },
      adminClient: { 
        works: !adminError, 
        error: adminError?.message 
      }
    };
  } catch (err) {
    return {
      regularClient: { works: false, error: err.message },
      adminClient: { works: false, error: err.message }
    };
  }
}

async function diagnoseDatabase() {
  console.log('🔍 EduDash Pro Database Diagnostic');
  console.log('=====================================\n');

  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using service role: ${supabaseServiceKey ? 'Yes' : 'No'}\n`);

  // Check connection by trying to query users table
  try {
    let existingTables = [];
    
    // Try to get table list using a direct query
    try {
      const { data, error } = await supabaseAdmin.rpc('exec', {
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
      });
      
      if (!error && data) {
        existingTables = data.map(row => row.table_name);
      }
    } catch (err) {
      // Fallback: just try to check some key tables directly
      console.log('⚠️ Cannot get table list, checking key tables directly...');
    }
    console.log(`✅ Connected successfully`);
    console.log(`📊 Found ${existingTables.length} tables in database\n`);

    // Check each expected table
    console.log('📋 Table Status Check:');
    console.log('======================');

    const missingTables = [];
    const existingTablesWithIssues = [];
    const healthyTables = [];

    for (const tableName of expectedTables) {
      const result = await checkTableExists(tableName);
      const status = result.exists ? '✅' : '❌';
      const errorMsg = result.error ? ` (${result.error})` : '';
      
      console.log(`${status} ${tableName}${errorMsg}`);
      
      if (!result.exists) {
        missingTables.push(tableName);
      } else if (result.error && !result.error.includes('infinite recursion')) {
        existingTablesWithIssues.push({ table: tableName, error: result.error });
      } else {
        healthyTables.push(tableName);
      }
    }

    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Healthy tables: ${healthyTables.length}`);
    console.log(`⚠️  Tables with issues: ${existingTablesWithIssues.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);

    if (missingTables.length > 0) {
      console.log('\n❌ Missing Tables:');
      missingTables.forEach(table => console.log(`   • ${table}`));
    }

    if (existingTablesWithIssues.length > 0) {
      console.log('\n⚠️  Tables with Issues:');
      existingTablesWithIssues.forEach(({ table, error }) => {
        console.log(`   • ${table}: ${error}`);
      });
    }

    // Check RLS policies specifically
    console.log('\n🔒 RLS Policy Check:');
    console.log('====================');
    
    const rlsResults = await checkRLSPolicies();
    
    console.log(`Regular client access: ${rlsResults.regularClient.works ? '✅' : '❌'}`);
    if (!rlsResults.regularClient.works) {
      console.log(`   Error: ${rlsResults.regularClient.error}`);
    }
    
    console.log(`Admin client access: ${rlsResults.adminClient.works ? '✅' : '❌'}`);
    if (!rlsResults.adminClient.works) {
      console.log(`   Error: ${rlsResults.adminClient.error}`);
    }

    // Check for superadmin user
    console.log('\n👤 User Status Check:');
    console.log('====================');
    
    try {
      const { data: users, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_active')
        .limit(10);

      if (userError) {
        console.log('❌ Cannot check users:', userError.message);
      } else {
        console.log(`📊 Total users found: ${users?.length || 0}`);
        const superadmins = users?.filter(u => u.role === 'superadmin') || [];
        console.log(`🔑 Superadmin users: ${superadmins.length}`);
        
        if (superadmins.length > 0) {
          superadmins.forEach(admin => {
            console.log(`   • ${admin.email} (${admin.is_active ? 'Active' : 'Inactive'})`);
          });
        }
        
        const targetSuperadmin = users?.find(u => u.email === 'superadmin@edudashpro.org.za');
        if (targetSuperadmin) {
          console.log('✅ Target superadmin user exists');
        } else {
          console.log('❌ Target superadmin user missing');
        }
      }
    } catch (err) {
      console.log('❌ Error checking users:', err.message);
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('===================');
    
    if (missingTables.length > 0) {
      console.log('🔧 Run the complete database restoration script to create missing tables');
    }
    
    if (!rlsResults.regularClient.works && rlsResults.regularClient.error?.includes('infinite recursion')) {
      console.log('🔧 Fix RLS policies to prevent infinite recursion');
    }
    
    if (existingTablesWithIssues.length === 0 && missingTables.length === 0) {
      console.log('🎉 Database looks healthy! Only RLS policies may need adjustment');
    }

    console.log('\n🔧 Next Steps:');
    console.log('1. Run the complete database restoration script if tables are missing');
    console.log('2. The script will also fix RLS policies and create the superadmin user');
    console.log('3. Then try signing in with: superadmin@edudashpro.org.za / #Olivia@17');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnoseDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
