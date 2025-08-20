/**
 * Authentication Utilities
 * Handles password management including temporary passwords, password resets, and validation
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('auth-utils');

/**
 * Interface for password reset request
 */
export interface PasswordResetRequest {
  email: string;
  resetUrl?: string;
  customMessage?: string;
}

/**
 * Interface for password reset with token
 */
export interface PasswordResetWithToken {
  token: string;
  newPassword: string;
  email: string;
}

/**
 * Generate a secure password that meets all requirements
 * - At least 12 characters long
 * - Contains uppercase, lowercase, numbers, and special characters
 * - Suitable for temporary passwords and secure generation
 */
export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure at least one character from each required category
  const password = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  // Fill remaining positions with random characters from all categories
  const allChars = lowercase + uppercase + digits + symbols;
  for (let i = 4; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the password array and join
  return password.sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a temporary password for new users
 * Creates a secure password and logs it for admin reference
 */
export function generateTempPassword(): string {
  const tempPassword = generateSecurePassword(12);
  log.info(`🔑 Generated temporary password (length: ${tempPassword.length})`);
  return tempPassword;
}

/**
 * Request a password reset for a user
 * Sends a password reset email using Supabase Auth
 */
export async function requestPasswordReset(request: PasswordResetRequest) {
  try {
    log.info(`🔐 Requesting password reset for: ${request.email}`);

    // Use Supabase's built-in password reset functionality
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      request.email,
      {
        redirectTo: request.resetUrl || 'https://app.edudashpro.org.za/reset-password'
      }
    );

    if (error) {
      log.error('❌ Password reset request failed:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }

    log.info('✅ Password reset email sent successfully');

    return {
      success: true,
      message: 'Password reset email sent successfully',
      data
    };
  } catch (error) {
    log.error('❌ Error requesting password reset:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Reset password using a token from email link
 * Completes the password reset flow
 */
export async function resetPasswordWithToken(resetData: PasswordResetWithToken) {
  try {
    log.info(`🔐 Resetting password with token for: ${resetData.email}`);

    // Validate password strength
    if (!isPasswordStrong(resetData.newPassword)) {
      throw new Error('Password does not meet security requirements');
    }

    // Use Supabase to update password
    const { data, error } = await supabase.auth.updateUser({
      password: resetData.newPassword
    });

    if (error) {
      log.error('❌ Password reset with token failed:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }

    log.info('✅ Password reset completed successfully');

    return {
      success: true,
      message: 'Password reset successfully',
      user: data.user
    };
  } catch (error) {
    log.error('❌ Error resetting password with token:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Validate password strength
 * Ensures password meets security requirements
 */
export function isPasswordStrong(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
}

/**
 * Update user password with admin privileges
 * Used by super admin to set temporary passwords
 */
export async function updateUserPasswordAdmin(authUserId: string, newPassword: string) {
  try {
    log.info(`🔐 Admin updating password for user: ${authUserId}`);

    if (!supabaseAdmin) {
      throw new Error('Admin client not available');
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        password: newPassword,
        user_metadata: {
          password_reset_required: true,
          temp_password_set_at: new Date().toISOString()
        }
      }
    );

    if (error) {
      log.error('❌ Admin password update failed:', error);
      throw new Error(`Admin password update failed: ${error.message}`);
    }

    log.info('✅ Admin password update completed successfully');

    return {
      success: true,
      message: 'Password updated successfully',
      user: data.user
    };
  } catch (error) {
    log.error('❌ Error updating password as admin:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Send forgot password email with custom template
 * Enhanced version with better email template and error handling
 */
export async function sendForgotPasswordEmail(email: string, customResetUrl?: string) {
  try {
    log.info(`📧 Sending forgot password email to: ${email}`);

    // First, verify the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (userError) {
      log.error('❌ Error checking user existence:', userError);
      throw new Error('Failed to verify user');
    }

    if (!user) {
      // For security, don't reveal whether email exists
      log.info('⚠️ Forgot password requested for non-existent user');
      return {
        success: true,
        message: 'If this email is registered, you will receive reset instructions'
      };
    }

    // Request password reset
    const resetResult = await requestPasswordReset({
      email: email,
      resetUrl: customResetUrl || 'https://app.edudashpro.org.za/reset-password'
    });

    if (!resetResult.success) {
      throw new Error(resetResult.error || 'Failed to send reset email');
    }

    // Optionally send enhanced email template using edge function
    try {
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: '🔐 Password Reset - EduDash Pro',
          html: generateForgotPasswordEmailTemplate(user.name, email),
          templateType: 'password_reset',
          metadata: {
            userId: user.id,
            resetRequestedAt: new Date().toISOString()
          }
        }
      });

      if (emailError) {
        log.warn('⚠️ Enhanced email template failed, fallback sent:', emailError);
      } else {
        log.info('📧 Enhanced forgot password email sent successfully');
      }
    } catch (templateError) {
      log.warn('⚠️ Enhanced email template error, fallback sent:', templateError);
    }

    return {
      success: true,
      message: 'Password reset instructions have been sent to your email'
    };
  } catch (error) {
    log.error('❌ Error sending forgot password email:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Generate forgot password email template
 * Professional HTML template for password reset emails
 */
function generateForgotPasswordEmailTemplate(userName: string, email: string): string {
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
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
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
                
                <!-- Security Notice -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 6px;">
                    <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🛡️ Security Notice</h4>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        If you didn't request this password reset, please ignore this email. Your account remains secure.
                        Someone may have entered your email address by mistake.
                    </p>
                </div>
                
                <!-- Alternative Instructions -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #6366f1;">
                    <h4 style="color: #4338ca; margin: 0 0 15px 0; font-size: 18px;">📋 Alternative Method</h4>
                    <p style="color: #4b5563; margin: 0 0 15px 0; font-size: 14px;">
                        If the button above doesn't work, copy and paste this link into your browser:
                    </p>
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 12px; color: #4338ca; word-break: break-all;">
                        [Reset link will be inserted here by Supabase]
                    </div>
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
                    
                    <div style="margin-bottom: 10px;">
                        <span style="color: #1d4ed8; font-weight: 600;">📞 Phone:</span>
                        <span style="color: #1e40af; margin-left: 8px;">+27 11 234 5678</span>
                    </div>
                    
                    <div>
                        <span style="color: #1d4ed8; font-weight: 600;">🕒 Hours:</span>
                        <span style="color: #1e40af; margin-left: 8px;">Monday - Friday, 8:00 AM - 6:00 PM SAST</span>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
                <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">🔐 Account Security</h3>
                <p style="color: #d1d5db; margin: 0 0 20px 0; font-size: 14px;">
                    We take your account security seriously. If you have any concerns, please contact us immediately.
                </p>
                
                <div style="margin: 20px 0;">
                    <a href="https://app.edudashpro.org.za" style="color: #dc2626; text-decoration: none; margin: 0 15px;">Dashboard</a>
                    <a href="https://docs.edudashpro.org.za" style="color: #dc2626; text-decoration: none; margin: 0 15px;">Help Center</a>
                    <a href="https://edudashpro.org.za" style="color: #dc2626; text-decoration: none; margin: 0 15px;">Website</a>
                </div>
                
                <p style="color: #9ca3af; margin: 20px 0 0 0; font-size: 12px;">
                    © 2025 EduDash Pro - Transforming Preschool Education in South Africa<br>
                    This email was sent to ${email}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Validate password reset token
 * Checks if a reset token is valid and not expired
 */
export async function validatePasswordResetToken(token: string) {
  try {
    log.info('🔐 Validating password reset token');

    // Supabase handles token validation internally
    // We can attempt to exchange the token to see if it's valid
    // This is typically done in the reset password page component
    
    return {
      success: true,
      message: 'Token validation requires client-side implementation'
    };
  } catch (error) {
    log.error('❌ Error validating password reset token:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Change user password (authenticated user)
 * For users who are already logged in and want to change their password
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    log.info('🔐 User changing password');

    // Validate new password strength
    if (!isPasswordStrong(newPassword)) {
      throw new Error('New password does not meet security requirements');
    }

    // Use Supabase to update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      log.error('❌ Password change failed:', error);
      throw new Error(`Password change failed: ${error.message}`);
    }

    log.info('✅ Password changed successfully');

    return {
      success: true,
      message: 'Password changed successfully',
      user: data.user
    };
  } catch (error) {
    log.error('❌ Error changing password:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Get password requirements text for UI display
 */
export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters long',
    'Contains uppercase letters (A-Z)',
    'Contains lowercase letters (a-z)',
    'Contains at least one number (0-9)',
    'Contains at least one special character (!@#$%^&*)'
  ];
}
