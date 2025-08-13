// Production Authentication System for EduDash Pro
// No console.log statements - production ready

import { supabase } from '@/lib/supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
  requiresSetup?: boolean;
}

export class ProductionAuth {
  
  /**
   * Register the first superadmin user (PRODUCTION SECURED)
   */
  static async registerSuperAdmin(email: string, password: string, name: string, setupToken: string): Promise<AuthResult> {
    try {
      // SECURITY: Verify setup token against environment variable
      const validSetupToken = process.env.EXPO_PUBLIC_SUPERADMIN_SETUP_TOKEN;
      if (!validSetupToken || setupToken !== validSetupToken) {
        return {
          success: false,
          error: 'Invalid setup authorization. Contact system administrator.'
        };
      }

      // Check if superadmin already exists
      const { data: existingAdmin } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('role', 'superadmin')
        .not('auth_user_id', 'is', null)
        .single();

      if (existingAdmin) {
        return {
          success: false,
          error: 'A super administrator already exists'
        };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'superadmin'
          }
        }
      });

      if (authError) {
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Update the placeholder superadmin user with auth_user_id
      const { error: updateError } = await supabase
        .from('users')
        .update({
          auth_user_id: authData.user.id,
          name,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('role', 'superadmin')
        .is('auth_user_id', null);

      if (updateError) {
        // If update failed, create new user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authData.user.id,
            email,
            name,
            role: 'superadmin',
            is_active: true,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          return {
            success: false,
            error: 'Failed to create user profile'
          };
        }
      }

      return {
        success: true,
        user: authData.user
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Sign in existing user
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user data received'
        };
      }

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      return {
        success: true,
        user: data.user
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUserProfile(authUserId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          preschools:preschool_id (
            name,
            address,
            subscription_status
          )
        `)
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to load profile' 
      };
    }
  }

  /**
   * Check if superadmin setup is required
   */
  static async requiresSuperAdminSetup(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'superadmin')
        .not('auth_user_id', 'is', null)
        .limit(1);

      if (error) return true;
      return !data || data.length === 0;
    } catch {
      return true;
    }
  }

  /**
   * Verify user has superadmin permissions
   */
  static async verifySuperAdminAccess(authUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !data) return false;
      return data.role === 'superadmin' && data.is_active;
    } catch {
      return false;
    }
  }
}
