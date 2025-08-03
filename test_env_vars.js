// Test environment variables in Expo context
console.log('🔍 Testing Environment Variables Access...\n');

// Check if we can access environment variables directly
console.log('1. Direct process.env access:');
console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || '❌ Not found');
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Not found');

// Try loading with dotenv
try {
  require('dotenv').config({ path: '.env.local' });
  console.log('\n2. After dotenv.config():');
  console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || '❌ Not found');
  console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Not found');
} catch (error) {
  console.log('\n2. Dotenv loading failed:', error.message);
}

// Show all environment variables that start with EXPO_PUBLIC_
console.log('\n3. All EXPO_PUBLIC_ variables:');
const expoVars = Object.keys(process.env)
  .filter(key => key.startsWith('EXPO_PUBLIC_'))
  .sort();
  
if (expoVars.length > 0) {
  expoVars.forEach(key => {
    const value = process.env[key];
    if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
      console.log(`- ${key}: ${value ? '✅ Set (hidden)' : '❌ Not set'}`);
    } else {
      console.log(`- ${key}: ${value || '❌ Not set'}`);
    }
  });
} else {
  console.log('❌ No EXPO_PUBLIC_ variables found');
}

// Test the specific Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n4. Supabase Configuration Check:');
if (supabaseUrl && supabaseKey) {
  console.log('✅ Both URL and Key are available');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  // Test if we can create Supabase client
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.log('❌ Failed to create Supabase client:', error.message);
  }
} else {
  console.log('❌ Missing Supabase configuration');
  console.log('URL available:', !!supabaseUrl);
  console.log('Key available:', !!supabaseKey);
}

console.log('\n🏁 Environment variable test completed!');
