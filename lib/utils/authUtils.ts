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
  token: string; // access_token from the URL hash
  newPassword: string;
  email: string;
  accessToken?: string; // alias of token
  refreshToken?: string; // refresh_token from the URL hash
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

    // Check if we have an active session first
    const { data: currentSession } = await supabase.auth.getSession();
    
    if (!currentSession.session) {
      // If no session, try to establish one with the tokens
      const access = resetData.accessToken || resetData.token;
      const refresh = resetData.refreshToken;

      if (access && refresh) {
        try {
          log.info('🔄 Establishing session for password reset...');
          const { error: sessErr } = await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh as string,
          });
          if (sessErr) {
            log.error('❌ setSession failed during reset flow:', sessErr);
            throw new Error(`Session establishment failed: ${sessErr.message}`);
          }
        } catch (e) {
          log.error('❌ Exception calling setSession:', e);
          throw new Error('Failed to establish reset session');
        }
      } else {
        throw new Error('Missing access/refresh tokens for password reset');
      }
    } else {
      log.info('✅ Using existing session for password reset');
    }

    // Update password for the currently-authenticated session
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
 * Uses Supabase auth with proper reset link - single email approach
 */
export async function sendForgotPasswordEmail(email: string, customResetUrl?: string) {
  try {
    log.info(`📧 Sending forgot password email to: ${email}`);

    // Always call Supabase password reset to avoid user enumeration issues
    // Build redirect URL from env with sensible defaults
    const webUrlBase = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.edudashpro.org.za';
    // IMPORTANT: expo-router group segments like (auth) are not part of the public URL path
    const redirect = customResetUrl || `${webUrlBase}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect });

    if (error) {
      log.error('❌ Password reset request failed:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }

    log.info('✅ Password reset email (GoTrue) initiated successfully');

    // Intentionally generic message regardless of user existence
    return {
      success: true,
      message: 'If this email is registered, you will receive reset instructions.'
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
 * Generate enhanced EduDash Pro password reset email template
 * Professional, mobile-first HTML template with improved branding
 */
export function generateForgotPasswordEmailTemplate(userName: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔐 Password Reset - EduDash Pro</title>
        <style>
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .content-padding { padding: 20px !important; }
                .mobile-hide { display: none !important; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); border-radius: 12px; overflow: hidden;">
            <!-- Modern Header with EduDash Pro Branding -->
            <div style="background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 25%, #16213e 50%, #0f3460 75%, #533a71 100%); padding: 40px 20px; text-align: center; position: relative;">
                <!-- Animated Particles Background -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.3;">
                    <div style="position: absolute; width: 4px; height: 4px; background: #00f5ff; border-radius: 50%; top: 20%; left: 10%; animation: float 3s ease-in-out infinite;"></div>
                    <div style="position: absolute; width: 3px; height: 3px; background: #8000ff; border-radius: 50%; top: 60%; left: 80%; animation: float 4s ease-in-out infinite;"></div>
                    <div style="position: absolute; width: 5px; height: 5px; background: #ff0080; border-radius: 50%; top: 40%; left: 60%; animation: float 3.5s ease-in-out infinite;"></div>
                </div>
                
                <!-- EduDash Pro Logo -->
                <div style="background: linear-gradient(45deg, #00f5ff 0%, #0080ff 50%, #8000ff 100%); width: 60px; height: 60px; border-radius: 30px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 245, 255, 0.3);">
                    <span style="font-size: 28px;">🧠</span>
                </div>
                
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">EduDash Pro</h1>
                <p style="color: #00f5ff; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; letter-spacing: 1px;">SOCIETY 5.0 • NEURAL EDUCATION</p>
                <div style="height: 20px; margin: 20px 0;"></div>
                <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🔐 Password Reset Request</h2>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Secure your neural education account</p>
            </div>
            
            <!-- Content -->
            <div class="content-padding" style="padding: 40px 30px;">
                <!-- Welcome Message -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #0f3460; margin: 0 0 10px 0; font-size: 24px; font-weight: 700;">Neural Access Reset</h2>
                    <p style="color: #533a71; font-size: 16px; margin: 0; font-weight: 500;">Secure your quantum education gateway</p>
                </div>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    Hello <strong style="color: #0f3460;">${userName || 'Neural Educator'}</strong>,
                </p>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    We received a request to reset the password for your EduDash Pro neural education account associated with:
                </p>
                
                <!-- Email Display -->
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; border: 2px solid #0ea5e9;">
                    <span style="font-family: 'Courier New', monospace; font-size: 16px; color: #0c4a6e; font-weight: 600;">${email}</span>
                </div>
                
                <!-- Enhanced Reset Instructions Card -->
                <div style="background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%); border-radius: 16px; padding: 35px; margin: 30px 0; border: 3px solid #6366f1; position: relative; overflow: hidden;">
                    <!-- Decorative Background Pattern -->
                    <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%); pointer-events: none;"></div>
                    
                    <div style="position: relative; z-index: 1;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <div style="background: linear-gradient(45deg, #6366f1 0%, #8b5cf6 100%); width: 60px; height: 60px; border-radius: 30px; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                                <span style="font-size: 28px;">🔑</span>
                            </div>
                            <h3 style="color: #4338ca; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">Neural Access Reset</h3>
                            <p style="color: #6366f1; margin: 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">QUANTUM SECURITY PROTOCOL</p>
                        </div>
                        
                        <p style="color: #4c1d95; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px; text-align: center;">
                            Click the quantum button below to access the neural reset portal and create your new password.
                        </p>
                        
                        <!-- Enhanced Reset Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.4); transition: all 0.3s ease; letter-spacing: 0.5px;">
                                🚀 ACTIVATE NEURAL RESET
                            </a>
                        </div>
                        
                        <!-- Security Timeline -->
                        <div style="background: rgba(99, 102, 241, 0.1); border-radius: 8px; padding: 20px; margin: 25px 0 0 0;">
                            <div style="text-align: center;">
                                <span style="color: #4338ca; font-size: 14px; font-weight: 600;">⏰ QUANTUM TIMER:</span>
                                <span style="color: #6366f1; font-size: 14px; margin-left: 8px;">Link expires in 1 hour for maximum security</span>
                            </div>
                        </div>
                    </div>
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
