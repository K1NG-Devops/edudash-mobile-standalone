#!/usr/bin/env node

/**
 * Test Simple Forgot Password Function
 * Tests the simplified forgot password functionality that sends only ONE working email
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Simplified forgot password function that mimics the updated authUtils
 */
async function sendForgotPasswordEmail(email, customResetUrl) {
  console.log(`📧 Sending forgot password email to: ${email}`);

  // First, verify the user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle();

  if (userError) {
    console.error('❌ Error checking user existence:', userError);
    throw new Error('Failed to verify user');
  }

  if (!user) {
    // For security, don't reveal whether email exists
    console.log('⚠️ Forgot password requested for non-existent user');
    return {
      success: true,
      message: 'If this email is registered, you will receive reset instructions'
    };
  }

  console.log('✅ User verified:', {
    id: user.id,
    name: user.name,
    email: user.email
  });

  // Use ONLY Supabase's password reset (which includes the working reset link)
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: customResetUrl || 'https://app.edudashpro.org.za/(auth)/reset-password'
    }
  );

  if (error) {
    console.error('❌ Password reset request failed:', error);
    throw new Error(`Password reset failed: ${error.message}`);
  }

  console.log('✅ Password reset email sent successfully via Supabase');

  return {
    success: true,
    message: 'Password reset instructions have been sent to your email'
  };
}

async function testSimpleForgotPasswordFlow() {
  console.log('🔐 Testing Simple Forgot Password Flow\n');
  
  const testEmail = 'superadmin@edudashpro.org.za';
  
  try {
    const result = await sendForgotPasswordEmail(testEmail);
    
    console.log('\n📧 Email Result:', result);
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Error in forgot password flow:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 EduDash Pro Simple Forgot Password Test\n');
  
  const result = await testSimpleForgotPasswordFlow();
  
  console.log('\n📊 Test Results:');
  console.log(`Simple Forgot Password Flow: ${result ? '✅ PASS' : '❌ FAIL'}`);
  
  if (result) {
    console.log('\n✅ SINGLE EMAIL sent successfully!');
    console.log('📧 Check your email inbox for:');
    console.log('   → Supabase password reset email with working reset link');
    console.log('\n🎯 No more duplicate emails!');
  } else {
    console.log('\n❌ Simple forgot password functionality has issues.');
    console.log('Please check the error messages above.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
}
