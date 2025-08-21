#!/usr/bin/env node

/**
 * Test Forgot Password Function
 * Tests the forgot password functionality directly
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

async function testForgotPasswordFlow() {
  console.log('🔐 Testing Forgot Password Flow\n');
  
  const testEmail = 'superadmin@edudashpro.org.za'; // Using existing superadmin user
  
  // Step 1: Check if user exists in database
  console.log('1️⃣ Checking if user exists...');
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, is_active')
    .eq('email', testEmail)
    .eq('is_active', true)
    .maybeSingle();

  if (userError) {
    console.error('❌ Error checking user:', userError);
    return false;
  }

  if (!user) {
    console.log(`⚠️ User ${testEmail} not found in database`);
    console.log('Creating a test user record...');
    
    // For testing, we'll just log this - you'd need to create a user first
    console.log('Please ensure you have a user with this email in your database');
    return false;
  }

  console.log('✅ User found:', {
    id: user.id,
    name: user.name,
    email: user.email,
    is_active: user.is_active
  });

  // Step 2: Test Supabase built-in password reset
  console.log('\n2️⃣ Testing Supabase password reset...');
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    testEmail,
    {
      redirectTo: 'https://app.edudashpro.org.za/reset-password'
    }
  );

  if (error) {
    console.error('❌ Supabase password reset failed:', error);
    return false;
  }

  console.log('✅ Supabase password reset initiated successfully');

  // Step 3: Test enhanced email template
  console.log('\n3️⃣ Testing enhanced email template...');
  
  const emailTemplate = generateForgotPasswordEmailTemplate(user.name, user.email);
  
  const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
    body: {
      to: testEmail,
      subject: '🔐 Password Reset - EduDash Pro (TEST)',
      html: emailTemplate,
      templateType: 'notification',
      metadata: {
        userId: user.id,
        resetRequestedAt: new Date().toISOString(),
        isTest: true
      }
    }
  });

  if (emailError) {
    console.error('❌ Enhanced email failed:', emailError);
    return false;
  }

  console.log('✅ Enhanced email sent successfully:', emailData);

  return true;
}

// Copy the email template function from authUtils
function generateForgotPasswordEmailTemplate(userName, email) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - EduDash Pro</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset Request (TEST)</h1>
                <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Secure your EduDash Pro account</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">Password Reset Requested</h2>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    Hello ${userName || 'there'},
                </p>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    We received a request to reset the password for your EduDash Pro account associated with 
                    <strong>${email}</strong>.
                </p>
                
                <!-- Reset Instructions Card -->
                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #dc2626;">
                    <h3 style="color: #b91c1c; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🔑 Reset Your Password</h3>
                    
                    <p style="color: #7f1d1d; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px; text-align: center;">
                        Click the button below to create a new password for your account.
                    </p>
                    
                    <!-- Reset Button -->
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                            🔐 Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #7f1d1d; line-height: 1.6; margin: 25px 0 0 0; font-size: 14px; text-align: center;">
                        This link will expire in 1 hour for security.
                    </p>
                </div>
                
                <!-- Test Notice -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 6px;">
                    <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🧪 Test Email Notice</h4>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        This is a test email sent to verify the forgot password functionality is working correctly.
                        The actual password reset link should be included in the Supabase email.
                    </p>
                </div>
                
                <!-- Support Information -->
                <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                    <h4 style="color: #1d4ed8; margin: 0 0 15px 0; font-size: 18px;">💪 Need Help?</h4>
                    
                    <p style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">
                        If you continue to have trouble resetting your password, please contact our support team:
                    </p>
                    
                    <div style="margin-bottom: 10px;">
                        <span style="color: #1d4ed8; font-weight: 600;">📧 Email:</span>
                        <a href="mailto:support@edudashpro.org.za" style="color: #2563eb; margin-left: 8px;">support@edudashpro.org.za</a>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
                <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">🔐 Account Security</h3>
                <p style="color: #d1d5db; margin: 0 0 20px 0; font-size: 14px;">
                    We take your account security seriously. If you have any concerns, please contact us immediately.
                </p>
                
                <p style="color: #9ca3af; margin: 20px 0 0 0; font-size: 12px;">
                    © 2025 EduDash Pro - Transforming Preschool Education in South Africa<br>
                    This test email was sent to ${email}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Main function
async function main() {
  console.log('🚀 EduDash Pro Forgot Password Test\n');
  
  const result = await testForgotPasswordFlow();
  
  console.log('\n📊 Test Results:');
  console.log(`Forgot Password Flow: ${result ? '✅ PASS' : '❌ FAIL'}`);
  
  if (result) {
    console.log('\n✅ Forgot password functionality is working!');
    console.log('📧 Check your email inbox for both:');
    console.log('1. Supabase password reset email (with actual reset link)');
    console.log('2. Enhanced template email (with custom styling)');
  } else {
    console.log('\n❌ Forgot password functionality has issues.');
    console.log('Please check the error messages above.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
}
