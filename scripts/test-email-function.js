#!/usr/bin/env node

/**
 * Test Email Function
 * Tests the Supabase edge function for sending emails
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

async function testEmailFunction() {
  console.log('🧪 Testing email function...');
  console.log('📧 Supabase URL:', supabaseUrl);
  console.log('🔑 Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

  const testEmail = {
    to: 'kingakeem.dev@gmail.com', // Change this to your email for testing
    subject: '🧪 Test Email - EduDash Pro Email System',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🧪 Email System Test</h1>
        </div>
        <div style="padding: 20px; background: white; border: 1px solid #ddd;">
          <h2>Email Function Test Results</h2>
          <p><strong>✅ Email sending is working correctly!</strong></p>
          <p>This is a test email sent from the EduDash Pro email system.</p>
          <ul>
            <li>Supabase Edge Function: ✅ Working</li>
            <li>Resend API Integration: ✅ Connected</li>
            <li>Email Template Rendering: ✅ Functional</li>
          </ul>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Sent at: ${new Date().toISOString()}<br>
            From: EduDash Pro Test System
          </p>
        </div>
      </div>
    `,
    templateType: 'notification',
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };

  try {
    console.log('📤 Sending test email...');
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: testEmail
    });

    if (error) {
      console.error('❌ Error invoking email function:', error);
      return false;
    }

    console.log('✅ Email function response:', data);
    
    if (data && data.success) {
      console.log('🎉 Test email sent successfully!');
      console.log('📨 Email ID:', data.email_id);
      return true;
    } else {
      console.error('❌ Email function returned error:', data);
      return false;
    }

  } catch (error) {
    console.error('❌ Exception sending test email:', error);
    return false;
  }
}

// Also test the forgot password email specifically
async function testForgotPasswordEmail() {
  console.log('\n🔐 Testing forgot password email functionality...');
  
  try {
    // Import the function we want to test
    const { sendForgotPasswordEmail } = await import('../lib/utils/authUtils.js');
    
    const result = await sendForgotPasswordEmail('kingakeem.dev@gmail.com');
    
    console.log('🔐 Forgot password result:', result);
    
    if (result.success) {
      console.log('✅ Forgot password email functionality working!');
    } else {
      console.error('❌ Forgot password email failed:', result.error);
    }
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Error testing forgot password email:', error);
    return false;
  }
}

// Environment check
async function checkEnvironment() {
  console.log('\n🔍 Checking environment configuration...');
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'FROM_EMAIL'
  ];
  
  let allPresent = true;
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`${envVar}: ${value ? '✅ Present' : '❌ Missing'}`);
    if (!value) allPresent = false;
  });
  
  if (!allPresent) {
    console.error('❌ Some required environment variables are missing');
    console.log('\nMake sure your .env.local file contains:');
    requiredEnvVars.forEach(envVar => {
      console.log(`${envVar}=your_${envVar.toLowerCase()}_here`);
    });
  }
  
  return allPresent;
}

// Main test runner
async function main() {
  console.log('🚀 EduDash Pro Email System Test\n');
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    process.exit(1);
  }
  
  // Test basic email function
  const basicTestPassed = await testEmailFunction();
  
  // Test forgot password specifically (commented out for now as it requires transpilation)
  // const forgotPasswordPassed = await testForgotPasswordEmail();
  
  console.log('\n📊 Test Summary:');
  console.log(`Environment Setup: ${envOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Basic Email Function: ${basicTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  // console.log(`Forgot Password Flow: ${forgotPasswordPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!basicTestPassed) {
    console.log('\n❌ Email system has issues that need to be resolved.');
    console.log('Common issues:');
    console.log('1. RESEND_API_KEY not set or invalid');
    console.log('2. Supabase edge function not deployed');
    console.log('3. FROM_EMAIL not verified in Resend');
    process.exit(1);
  } else {
    console.log('\n✅ Email system appears to be working correctly!');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
}
