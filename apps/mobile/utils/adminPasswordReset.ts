import { supabase } from '@/lib/supabase';

/**
 * Admin function to send a password reset email to any user
 * This should only be called by authenticated admins/support staff
 */
export const sendPasswordResetAsAdmin = async (
  email: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {

    // Optional: Verify the requesting user is an admin
    if (adminUserId) {
      const { data: adminProfile } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', adminUserId)
        .single();

      if (!adminProfile || !['superadmin', 'preschool_admin'].includes(adminProfile.role)) {
        return { success: false, error: 'Unauthorized: Admin access required' };
      }
    }

    // Send the password reset email with appropriate redirect URL
    // For production, use the web URL; for development, use localhost
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction
      ? 'https://app.edudashpro.org.za'
      : 'http://localhost:8081';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    if (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error: any) {
    console.error('❌ Exception in sendPasswordResetAsAdmin:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Admin function to check if a user exists before sending reset
 */
export const checkUserExistsAndSendReset = async (
  email: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string; userFound?: boolean }> => {
  try {
    // First check if user exists in our system
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { success: false, error: 'Database error checking user' };
    }

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found in system',
        userFound: false
      };
    }

    if (!existingUser.is_active) {
      return {
        success: false,
        error: 'User account is inactive',
        userFound: true
      };
    }

    // User exists and is active, send the reset email
    const resetResult = await sendPasswordResetAsAdmin(email, adminUserId);
    return {
      ...resetResult,
      userFound: true
    };

  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
