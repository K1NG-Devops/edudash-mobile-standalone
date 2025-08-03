const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserPreschools() {
  try {
    console.log('👥 Checking users and their preschool associations...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role, preschool_id')
      .order('name');

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    console.log(`\n✅ Found ${users.length} user(s):`);
    console.log('─'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Unnamed'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Preschool ID: ${user.preschool_id || 'N/A'}`);
      console.log('─'.repeat(40));
    });

    // Check unique preschool IDs
    const preschoolIds = [...new Set(users.map(u => u.preschool_id).filter(Boolean))];
    console.log(`\n🏫 Unique preschool IDs referenced by users: ${preschoolIds.length}`);
    preschoolIds.forEach(id => {
      const usersInPreschool = users.filter(u => u.preschool_id === id);
      console.log(`   - ${id}: ${usersInPreschool.length} users`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserPreschools();
