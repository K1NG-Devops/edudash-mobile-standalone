#!/usr/bin/env node

/**
 * Check what data is currently in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Use service role key if available, otherwise use anon key
const supabaseKey = serviceRoleKey || anonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking database contents...\n');

async function checkData() {
  try {
    console.log('1️⃣ Checking preschool_onboarding_requests table...');
    const { data: requests, error: requestsError } = await supabase
      .from('preschool_onboarding_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Error fetching onboarding requests:', requestsError);
    } else {
      console.log(`✅ Found ${requests.length} onboarding request(s):`);
      requests.forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.preschool_name} (${request.admin_email}) - Status: ${request.status}`);
      });
    }

    console.log('\n2️⃣ Checking preschools table...');
    const { data: preschools, error: preschoolsError } = await supabase
      .from('preschools')
      .select('*')
      .order('created_at', { ascending: false });

    if (preschoolsError) {
      console.error('❌ Error fetching preschools:', preschoolsError);
    } else {
      console.log(`✅ Found ${preschools.length} preschool(s):`);
      preschools.forEach((preschool, index) => {
        console.log(`   ${index + 1}. ${preschool.name} (${preschool.email}) - Status: ${preschool.subscription_status}`);
      });
    }

    console.log('\n3️⃣ Checking users table for admin users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['superadmin', 'preschool_admin', 'admin'])
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Found ${users.length} admin user(s):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Active: ${user.is_active}`);
      });
    }

    console.log('\n📋 Summary:');
    console.log(`   - Onboarding Requests: ${requests?.length || 0}`);
    console.log(`   - Preschools: ${preschools?.length || 0}`);
    console.log(`   - Admin Users: ${users?.length || 0}`);

    if (requests && requests.length > 0) {
      console.log('\n💡 The onboarding screen is showing LIVE data from your database.');
      console.log('   The names you see are from the test data setup scripts.');
      console.log('   To show fresh data, you can either:');
      console.log('   1. Delete the test data from the database');
      console.log('   2. Submit new requests through the onboarding form');
      console.log('   3. Clear all test data and start fresh');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkData();
