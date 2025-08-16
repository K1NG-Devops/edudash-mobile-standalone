#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable(tableName) {
  try {

    // Try to get one record to see the column structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {

        return null;
      } else {

        return null;
      }
    }
    
    if (data && data.length > 0) {

      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        const value = data[0][col];
        const type = typeof value;

      });

    } else {
      // Table exists but is empty - try to get schema info differently

      // Try a simple insert to see what columns are expected (this will fail but show us the schema)
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({});
        
      if (insertError && insertError.message.includes('null value')) {

        const matches = insertError.message.match(/column "([^"]+)"/g);
        if (matches) {
          matches.forEach((match, index) => {
            const colName = match.match(/column "([^"]+)"/)[1];

          });
        }
      }
    }

    return data;
    
  } catch (err) {

    return null;
  }
}

async function main() {

  const paymentTables = [
    'payments',
    'payment_fees', 
    'payment_receipts',
    'payment_methods',
    'users',
    'students'
  ];
  
  for (const table of paymentTables) {
    await inspectTable(table);
  }

}

main();
