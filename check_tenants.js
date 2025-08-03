const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Environment Check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
  try {
    console.log('\n📋 Checking preschools (tenants) table...');
    
    const { data: preschools, error } = await supabase
      .from('preschools')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching preschools:', error);
      return;
    }

    if (!preschools || preschools.length === 0) {
      console.log('❌ No preschools found in the database');
      return;
    }

    console.log(`\n✅ Found ${preschools.length} preschool(s):`);
    console.log('─'.repeat(80));
    
    preschools.forEach((preschool, index) => {
      console.log(`${index + 1}. ${preschool.name}`);
      console.log(`   ID: ${preschool.id}`);
      console.log(`   Slug: ${preschool.slug || 'N/A'}`);
      console.log(`   Address: ${preschool.address || 'N/A'}`);
      console.log(`   Phone: ${preschool.phone || 'N/A'}`);
      console.log(`   Email: ${preschool.email || 'N/A'}`);
      console.log(`   Created: ${preschool.created_at || 'N/A'}`);
      console.log('─'.repeat(40));
    });

    // Also check how many users are associated with each preschool
    console.log('\n👥 Users per preschool:');
    for (const preschool of preschools) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('preschool_id', preschool.id);

      if (!usersError && users) {
        console.log(`${preschool.name}: ${users.length} users`);
        users.forEach(user => {
          console.log(`  - ${user.name || 'Unnamed'} (${user.role})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTenants();
