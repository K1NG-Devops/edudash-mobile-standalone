const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserPreschools() {
  try {

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role, preschool_id')
      .order('name');

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {

      return;
    }

    users.forEach((user, index) => {

    });

    // Check unique preschool IDs
    const preschoolIds = [...new Set(users.map(u => u.preschool_id).filter(Boolean))];

    preschoolIds.forEach(id => {
      const usersInPreschool = users.filter(u => u.preschool_id === id);

    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserPreschools();
