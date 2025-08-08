#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Database Schema Inspector');
console.log('============================\n');

async function inspectTable(tableName) {
  try {
    console.log(`📋 Table: ${tableName}`);
    console.log('─'.repeat(40));
    
    // Try to get one record to see the column structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log(`❌ Table "${tableName}" does not exist\n`);
        return null;
      } else {
        console.log(`⚠️  Error accessing "${tableName}": ${error.message}\n`);
        return null;
      }
    }
    
    if (data && data.length > 0) {
      console.log('✅ Columns found:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        const value = data[0][col];
        const type = typeof value;
        console.log(`   ${index + 1}. ${col} (${type})`);
      });
      console.log(`📊 Sample record count: ${data.length}`);
    } else {
      // Table exists but is empty - try to get schema info differently
      console.log('✅ Table exists but is empty');
      console.log('🔍 Attempting to detect columns...');
      
      // Try a simple insert to see what columns are expected (this will fail but show us the schema)
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({});
        
      if (insertError && insertError.message.includes('null value')) {
        console.log('📝 Required columns (from insert error):');
        const matches = insertError.message.match(/column "([^"]+)"/g);
        if (matches) {
          matches.forEach((match, index) => {
            const colName = match.match(/column "([^"]+)"/)[1];
            console.log(`   ${index + 1}. ${colName} (required)`);
          });
        }
      }
    }
    
    console.log('');
    return data;
    
  } catch (err) {
    console.log(`❌ Failed to inspect "${tableName}": ${err.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🎯 Inspecting payment-related tables...\n');
  
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
  
  console.log('🔧 Next steps:');
  console.log('1. Based on the column names above, I will create a corrected RLS policy file');
  console.log('2. The corrected file will match your actual database schema');
  console.log('3. You can then run the corrected RLS policies safely');
  
  console.log('\n✨ Schema inspection completed!');
}

main();
