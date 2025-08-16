const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTriggers() {
  try {
    // Check triggers on auth.users table
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          t.trigger_name,
          t.event_manipulation,
          t.event_object_schema,
          t.event_object_table,
          t.action_statement
        FROM information_schema.triggers t
        WHERE t.event_object_schema = 'auth' 
        AND t.event_object_table = 'users'
        ORDER BY t.trigger_name;
      `
    });

    if (error) {
      // Try alternative method using direct SQL
      const { data: rawResult, error: rawError } = await supabase
        .from('__none__') // This won't work, but let's try a raw query
        .select('*');
      
      if (rawError) {
        console.log('Trying to execute raw SQL query...');
        
        // Let's try to execute the query directly
        const { data: triggerData, error: triggerError } = await supabase
          .rpc('exec_sql', {
            sql: `
              SELECT 
                t.trigger_name,
                t.event_manipulation,
                t.event_object_schema,
                t.event_object_table,
                t.action_statement
              FROM information_schema.triggers t
              WHERE t.event_object_schema = 'auth' 
              AND t.event_object_table = 'users'
              ORDER BY t.trigger_name;
            `
          });
        
        if (triggerError) {
          console.error('Error querying triggers:', triggerError);
          return;
        }
        
        console.log('Active triggers on auth.users:', triggerData);
      }
    } else {
      console.log('Active triggers on auth.users:', data);
    }

    // Also check for handle_new_user function usage
    const { data: functionData, error: functionError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          routine_name,
          routine_type,
          routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name LIKE '%handle_new%'
        ORDER BY routine_name;
      `
    });

    if (functionError) {
      console.error('Error querying functions:', functionError);
    } else {
      console.log('Handle new user functions:', functionData);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkTriggers();
