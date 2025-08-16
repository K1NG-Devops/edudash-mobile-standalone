import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Development-only utility to bypass RLS policies when they cause infinite recursion.
 * 
 * WARNING: This should NEVER be used in production. It's designed to help during
 * development when RLS policies are misconfigured and causing infinite recursion.
 */

const DEV_MODE = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development' ||
  process.env.NODE_ENV === 'development' ||
  __DEV__;

interface DevBypassResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

/**
 * Attempts to load user profile using service role to bypass RLS policies
 * This is a last resort when regular profile loading fails due to policy recursion
 */
export const devBypassLoadProfile = async (authUserId: string): Promise<DevBypassResult> => {
  if (!DEV_MODE) {
    return {
      success: false,
      error: 'Dev bypass is only available in development mode'
    };
  }

  if (!supabaseAdmin) {
    return {
      success: false,
      error: 'Admin client not available - service role key missing'
    };
  }

  try {
    console.log('🔧 [DEV-BYPASS] Attempting to load profile via admin client for:', authUserId);

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('🔧 [DEV-BYPASS] Admin query failed:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data) {
      console.warn('🔧 [DEV-BYPASS] No user found with auth_user_id:', authUserId);
      return {
        success: false,
        error: 'User not found'
      };
    }

    console.log('🔧 [DEV-BYPASS] Successfully loaded profile via admin client');
    console.log('  - User ID:', data.id);
    console.log('  - Name:', data.name);
    console.log('  - Role:', data.role);

    const profile: UserProfile = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as 'superadmin' | 'preschool_admin' | 'teacher' | 'parent',
      preschool_id: data.preschool_id,
      auth_user_id: data.auth_user_id || '',
      is_active: !!data.is_active,
      avatar_url: data.avatar_url,
      phone: data.phone,
      home_address: data.home_address,
      home_city: data.home_city,
      home_postal_code: data.home_postal_code,
      work_company: data.work_company,
      work_position: data.work_position,
      work_address: data.work_address,
      work_phone: data.work_phone,
      emergency_contact_1_name: data.emergency_contact_1_name,
      emergency_contact_1_phone: data.emergency_contact_1_phone,
      emergency_contact_1_relationship: data.emergency_contact_1_relationship,
      emergency_contact_2_name: data.emergency_contact_2_name,
      emergency_contact_2_phone: data.emergency_contact_2_phone,
      emergency_contact_2_relationship: data.emergency_contact_2_relationship,
      relationship_to_child: data.relationship_to_child,
      pickup_authorized: data.pickup_authorized,
      profile_completed_at: data.profile_completed_at,
      profile_completion_status: (data.profile_completion_status as 'incomplete' | 'in_progress' | 'complete') || 'incomplete',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };

    return {
      success: true,
      profile
    };

  } catch (error) {
    console.error('🔧 [DEV-BYPASS] Exception during bypass:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Quick check if RLS policies might be causing issues
 */
export const diagnoseRLSIssues = async (authUserId: string): Promise<{
  hasRLSIssue: boolean;
  details: string[];
}> => {
  if (!DEV_MODE) {
    return {
      hasRLSIssue: false,
      details: ['Diagnostic not available in production']
    };
  }

  const details: string[] = [];

  try {
    // Test regular client
    if (!supabaseAdmin) {
      return { hasRLSIssue: false, details: ['Admin client not available'] };
    }
    const { data: regularData, error: regularError } = await supabaseAdmin.from('users')
      .select('id, auth_user_id, role')
      .eq('auth_user_id', authUserId)
      .single();

    if (regularError) {
      details.push(`Regular query error: ${regularError.message}`);
      if (regularError.message.includes('policy') ||
        regularError.message.includes('recursion') ||
        regularError.code === 'PGRST116') {
        return {
          hasRLSIssue: true,
          details
        };
      }
    } else if (regularData) {
      details.push('Regular query successful');
    }

    return {
      hasRLSIssue: false,
      details
    };

  } catch (error) {
    details.push(`Exception during diagnosis: ${error}`);
    return {
      hasRLSIssue: true,
      details
    };
  }
};
