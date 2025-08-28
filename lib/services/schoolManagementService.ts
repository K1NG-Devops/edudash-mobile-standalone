import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Tables = Database['public']['Tables'];
type Preschool = Tables['preschools']['Row'];
type User = Tables['users']['Row'];
type SchoolInvitationCode = Tables['school_invitation_codes']['Row'];

export interface CreateSchoolData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  timezone?: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  max_students?: number;
  max_teachers?: number;

  // Principal information
  principal_name: string;
  principal_email: string;
  principal_phone?: string;
}

export interface SchoolConfigurationData {
  // Basic settings
  school_hours?: string;
  grade_levels?: string[];
  curriculum_type?: string;
  academic_year_start?: string;
  academic_year_end?: string;

  // Features
  enable_video_calls?: boolean;
  enable_homework_ai?: boolean;
  enable_lesson_generator?: boolean;
  enable_parent_messaging?: boolean;

  // Branding
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  welcome_message?: string;
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  invitation_code?: string;
  expires_at?: string;
}

export interface OnboardingStepResult {
  success: boolean;
  error?: string;
  next_step?: string;
}

export class SchoolManagementService {

  /**
   * Create a new school with principal
   */
  static async createSchool(data: CreateSchoolData): Promise<{
    success: boolean;
    error?: string;
    school_id?: string;
    principal_id?: string;
  }> {
    try {
      // 1. Generate unique tenant slug
      const tenantSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .trim()
        + '-' + Math.random().toString(36).substring(2, 8);

      // 2. Create the school
      const { data: school, error: schoolError } = await supabase
        .from('preschools')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          timezone: data.timezone || 'Africa/Johannesburg',
          tenant_slug: tenantSlug,
          subscription_plan: data.subscription_plan,
          subscription_status: 'trial',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
          max_students: data.max_students || this.getDefaultLimits(data.subscription_plan).students,
          max_teachers: data.max_teachers || this.getDefaultLimits(data.subscription_plan).teachers,
          onboarding_status: 'pending_principal',
          setup_completed: false,
        })
        .select()
        .single();

      if (schoolError) {
        throw new Error(`Failed to create school: ${schoolError.message}`);
      }

      // 3. Create invitation for principal
      const principalInvitation = await this.createPrincipalInvitation(
        school.id,
        data.principal_email,
        data.principal_name
      );

      if (!principalInvitation.success) {
        // If principal invitation fails, we should clean up the school
        await supabase.from('preschools').delete().eq('id', school.id);
        throw new Error(`Failed to create principal invitation: ${principalInvitation.error}`);
      }

      // 4. Send welcome email to principal (would integrate with email service)
      await this.sendPrincipalWelcomeEmail(
        data.principal_email,
        data.principal_name,
        school.name,
        principalInvitation.invitation_code!
      );

      return {
        success: true,
        school_id: school.id,
        principal_id: principalInvitation.invitation_code,
      };

    } catch (error: any) {
      console.error('Error creating school:', error);
      return {
        success: false,
        error: error.message || 'Failed to create school',
      };
    }
  }

  /**
   * Create principal invitation
   */
  static async createPrincipalInvitation(
    schoolId: string,
    email: string,
    name: string
  ): Promise<InvitationResult> {
    try {
      // Generate unique invitation code
      const invitationCode = 'PRIN-' + Math.random().toString(36).substring(2, 12).toUpperCase();

      const { data, error } = await supabase
        .from('school_invitation_codes')
        .insert({
          code: invitationCode,
          preschool_id: schoolId,
          invitation_type: 'principal',
          invited_email: email,
          invited_by: '00000000-0000-0000-0000-000000000000', // System/Super Admin
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          max_uses: 1,
          current_uses: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        invitation_code: invitationCode,
        expires_at: data.expires_at,
      };

    } catch (error: any) {
      console.error('Error creating principal invitation:', error);
      return {
        success: false,
        error: error.message || 'Failed to create invitation',
      };
    }
  }

  /**
   * Create teacher invitation
   */
  static async createTeacherInvitation(
    schoolId: string,
    email: string,
    name: string,
    invitedBy: string
  ): Promise<InvitationResult> {
    try {
      const invitationCode = 'TEACH-' + Math.random().toString(36).substring(2, 12).toUpperCase();

      const { data, error } = await supabase
        .from('school_invitation_codes')
        .insert({
          code: invitationCode,
          preschool_id: schoolId,
          invitation_type: 'teacher',
          invited_email: email,
          invited_name: name,
          invited_by: invitedBy,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          max_uses: 1,
          current_uses: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        invitation_code: invitationCode,
        expires_at: data.expires_at,
      };

    } catch (error: any) {
      console.error('Error creating teacher invitation:', error);
      return {
        success: false,
        error: error.message || 'Failed to create teacher invitation',
      };
    }
  }

  /**
   * Create parent invitation code (reusable)
   */
  static async createParentInvitationCode(
    schoolId: string,
    invitedBy: string,
    maxUses: number = 50
  ): Promise<InvitationResult> {
    try {
      const invitationCode = 'PARENT-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase
        .from('school_invitation_codes')
        .insert({
          code: invitationCode,
          preschool_id: schoolId,
          invitation_type: 'parent',
          invited_by: invitedBy,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          max_uses: maxUses,
          current_uses: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        invitation_code: invitationCode,
        expires_at: data.expires_at,
      };

    } catch (error: any) {
      console.error('Error creating parent invitation code:', error);
      return {
        success: false,
        error: error.message || 'Failed to create parent invitation code',
      };
    }
  }

  /**
   * Process invitation code signup
   */
  static async processInvitationSignup(
    invitationCode: string,
    email: string,
    password: string,
    userData: any
  ): Promise<{
    success: boolean;
    error?: string;
    user_id?: string;
    role?: string;
    preschool_id?: string;
  }> {
    try {
      // 1. Validate invitation code
      const { data: invitation, error: invitationError } = await supabase
        .from('school_invitation_codes')
        .select('*')
        .eq('code', invitationCode)
        .single();

      if (invitationError || !invitation) {
        return { success: false, error: 'Invalid invitation code' };
      }

      // 2. Check expiration and usage limits
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: 'Invitation code has expired' };
      }

      const currentUses = invitation.current_uses || 0;
      const maxUses = invitation.max_uses || 1;

      if (currentUses >= maxUses) {
        return { success: false, error: 'Invitation code has reached maximum uses' };
      }

      // 3. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: userData.name,
            invitation_code: invitationCode,
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // 4. Create user profile
      const role = invitation.invitation_type === 'principal' ? 'preschool_admin' :
        invitation.invitation_type === 'teacher' ? 'teacher' : 'parent';

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          name: userData.name,
          role: role,
          auth_user_id: authData.user.id,
          preschool_id: invitation.preschool_id,
          is_active: true,
          phone: userData.phone,
          profile_completion_status: 'in_progress',
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: 'Failed to create user profile' };
      }

      // 5. Update invitation usage
      const newCurrentUses = (invitation.current_uses || 0) + 1;
      await supabase
        .from('school_invitation_codes')
        .update({ current_uses: newCurrentUses })
        .eq('id', invitation.id);

      // 6. If this is principal signup, update school onboarding status
      if (invitation.invitation_type === 'principal') {
        await supabase
          .from('preschools')
          .update({
            onboarding_status: 'principal_created',
          })
          .eq('id', invitation.preschool_id);
      }

      return {
        success: true,
        user_id: authData.user.id,
        role: role,
        preschool_id: invitation.preschool_id,
      };

    } catch (error: any) {
      console.error('Error processing invitation signup:', error);
      return {
        success: false,
        error: error.message || 'Failed to process invitation signup',
      };
    }
  }

  /**
   * Complete school configuration
   */
  static async configureSchool(
    schoolId: string,
    configuration: SchoolConfigurationData
  ): Promise<OnboardingStepResult> {
    try {
      const { error } = await supabase
        .from('preschools')
        .update({
          onboarding_status: 'configured',
          // Store configuration in a separate table or as JSON
          // For now, we'll add some basic fields
          ...(configuration.logo_url && { logo_url: configuration.logo_url }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', schoolId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        next_step: 'invite_teachers',
      };

    } catch (error: any) {
      console.error('Error configuring school:', error);
      return {
        success: false,
        error: error.message || 'Failed to configure school',
      };
    }
  }

  /**
   * Complete school onboarding
   */
  static async completeOnboarding(schoolId: string): Promise<OnboardingStepResult> {
    try {
      const { error } = await supabase
        .from('preschools')
        .update({
          onboarding_status: 'completed',
          setup_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', schoolId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        next_step: 'dashboard',
      };

    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete onboarding',
      };
    }
  }

  /**
   * Get subscription plan limits
   */
  private static getDefaultLimits(plan: string) {
    switch (plan) {
      case 'free':
        return { students: 20, teachers: 2 };
      case 'basic':
        return { students: 50, teachers: 5 };
      case 'pro':
        return { students: 150, teachers: 15 };
      case 'enterprise':
        return { students: 1000, teachers: 100 };
      default:
        return { students: 20, teachers: 2 };
    }
  }

  /**
   * Send welcome email to principal (placeholder)
   */
  private static async sendPrincipalWelcomeEmail(
    email: string,
    name: string,
    schoolName: string,
    invitationCode: string
  ): Promise<void> {
    // TODO: Integrate with email service (SendGrid, etc.)
    console.log(`📧 Welcome email sent to ${email}:`);
    console.log(`Subject: Welcome to EduDash Pro - Complete Your School Setup`);
    console.log(`Hello ${name},`);
    console.log(`Your school "${schoolName}" has been created on EduDash Pro!`);
    console.log(`Your invitation code: ${invitationCode}`);
    console.log(`Please complete your registration to get started.`);
  }

  /**
   * Get school onboarding status
   */
  static async getOnboardingStatus(schoolId: string): Promise<{
    success: boolean;
    status?: string;
    steps_completed?: string[];
    next_step?: string;
    error?: string;
  }> {
    try {
      const { data: school, error } = await supabase
        .from('preschools')
        .select('onboarding_status, setup_completed')
        .eq('id', schoolId)
        .single();

      if (error) {
        throw error;
      }

      const stepsCompleted = [];
      let nextStep = 'principal_signup';

      switch (school.onboarding_status) {
        case 'pending_principal':
          nextStep = 'principal_signup';
          break;
        case 'principal_created':
          stepsCompleted.push('principal_signup');
          nextStep = 'school_configuration';
          break;
        case 'configured':
          stepsCompleted.push('principal_signup', 'school_configuration');
          nextStep = 'invite_teachers';
          break;
        case 'completed':
          stepsCompleted.push('principal_signup', 'school_configuration', 'invite_teachers');
          nextStep = 'dashboard';
          break;
      }

      return {
        success: true,
        status: school.onboarding_status || 'pending_principal',
        steps_completed: stepsCompleted,
        next_step: nextStep,
      };

    } catch (error: any) {
      console.error('Error getting onboarding status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get onboarding status',
      };
    }
  }
}
