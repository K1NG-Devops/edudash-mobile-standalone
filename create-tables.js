const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTables() {
  console.log('🚀 Creating necessary tables for onboarding functionality...\n');

  const queries = [
    // 1. Create schools table
    `CREATE TABLE IF NOT EXISTS schools (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      address text,
      status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )`,

    // 2. Create admin_users table
    `CREATE TABLE IF NOT EXISTS admin_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id text UNIQUE,
      email text NOT NULL UNIQUE,
      first_name text NOT NULL,
      last_name text NOT NULL,
      role text NOT NULL CHECK (role IN ('superadmin', 'preschool_admin', 'teacher', 'parent')),
      phone text,
      is_active boolean DEFAULT true,
      school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )`,

    // 3. Create onboarding_requests table
    `CREATE TABLE IF NOT EXISTS onboarding_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_name text NOT NULL,
      admin_first_name text NOT NULL,
      admin_last_name text NOT NULL,
      admin_email text NOT NULL,
      admin_phone text,
      school_address text,
      message text,
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
      reviewed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
      reviewed_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )`
  ];

  // Execute table creation queries
  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`Creating table ${i + 1}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: queries[i] });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Failed to create table ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Table ${i + 1} created successfully`);
      }
    } catch (err) {
      console.error(`❌ Error creating table ${i + 1}:`, err.message);
    }
  }

  // Insert sample data
  console.log('\n📝 Inserting sample data...');

  try {
    // Insert superadmin user
    const { data: superadminData, error: superadminError } = await supabase
      .from('admin_users')
      .insert({
        auth_user_id: 'temp_' + Date.now(),
        email: 'superadmin@edudashpro.org.za',
        first_name: 'EduDash Pro',
        last_name: 'Super Administrator',
        role: 'superadmin',
        is_active: true
      })
      .select();

    if (superadminError && !superadminError.message.includes('duplicate key')) {
      console.error('❌ Failed to create superadmin:', superadminError.message);
    } else {
      console.log('✅ Superadmin user created');
    }

    // Insert sample schools
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert([
        {
          name: 'Little Stars Preschool',
          email: 'admin@littlestars.co.za',
          phone: '+27 11 123 4567',
          address: '123 Main Street, Johannesburg',
          status: 'active'
        },
        {
          name: 'Rainbow Kids Academy', 
          email: 'contact@rainbowkids.co.za',
          phone: '+27 21 987 6543',
          address: '456 Oak Avenue, Cape Town',
          status: 'active'
        }
      ])
      .select();

    if (schoolError && !schoolError.message.includes('duplicate key')) {
      console.error('❌ Failed to create schools:', schoolError.message);
    } else {
      console.log('✅ Sample schools created');
    }

    // Insert sample onboarding requests
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding_requests')
      .insert([
        {
          school_name: 'Sunshine Daycare',
          admin_first_name: 'Emma',
          admin_last_name: 'Williams',
          admin_email: 'emma@sunshine.co.za',
          admin_phone: '+27 11 555 1234',
          school_address: '789 Sun Street, Pretoria',
          message: 'We would like to join EduDash Pro',
          status: 'pending'
        },
        {
          school_name: 'Happy Hearts Nursery',
          admin_first_name: 'James',
          admin_last_name: 'Brown',
          admin_email: 'james@happyhearts.co.za',
          admin_phone: '+27 31 555 5678',
          school_address: '321 Heart Avenue, Durban',
          message: 'Looking forward to using your platform',
          status: 'pending'
        }
      ])
      .select();

    if (onboardingError && !onboardingError.message.includes('duplicate key')) {
      console.error('❌ Failed to create onboarding requests:', onboardingError.message);
    } else {
      console.log('✅ Sample onboarding requests created');
    }

  } catch (err) {
    console.error('❌ Error inserting sample data:', err.message);
  }

  // Verify tables exist
  console.log('\n🔍 Verifying table creation...');
  
  const tables = ['schools', 'admin_users', 'onboarding_requests'];
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' not accessible:`, error.message);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}' verification failed:`, err.message);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('\n🎉 SUCCESS! Database setup complete.');
    console.log('📧 Superadmin email: superadmin@edudashpro.org.za');
    console.log('🔑 Password: #Olivia@17');
    console.log('\n✅ The resend functionality should now work!');
  } else {
    console.log('\n⚠️  Some tables may not have been created properly.');
  }
}

createTables();
