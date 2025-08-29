const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
  try {

    const { data: preschools, error } = await supabase
      .from('preschools')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching preschools:', error);
      return;
    }

    if (!preschools || preschools.length === 0) {

      return;
    }

    preschools.forEach((preschool, index) => {

    });

    // Also check how many users are associated with each preschool

    for (const preschool of preschools) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('preschool_id', preschool.id);

      if (!usersError && users) {

        users.forEach(user => {

        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTenants();
