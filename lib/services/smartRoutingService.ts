import { router } from 'expo-router';

export interface UserOnboardingFlow {
  userType: 'parent' | 'teacher' | 'principal' | 'individual_family' | 'homeschool_parent' | 'private_tutor';
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  hasInvitationCode: boolean;
  institutionType?: 'preschool' | 'primary' | 'secondary' | 'none';
}

export interface RoutingDecision {
  path: string;
  params: Record<string, string>;
  onboardingType: 'institutional' | 'individual' | 'school_creation';
  requiredSteps: string[];
}

export class SmartRoutingService {
  /**
   * Determines the appropriate onboarding flow based on user selection
   */
  static determineOnboardingFlow(
    planId: string,
    roleId: string,
    hasInvitationCode = false
  ): RoutingDecision {
    const flow: UserOnboardingFlow = {
      userType: roleId as UserOnboardingFlow['userType'],
      subscriptionTier: this.mapPlanToTier(planId),
      hasInvitationCode,
      institutionType: this.determineInstitutionType(roleId)
    };

    return this.generateRoutingDecision(flow);
  }

  /**
   * Maps pricing plan IDs to subscription tiers
   */
  private static mapPlanToTier(planId: string): UserOnboardingFlow['subscriptionTier'] {
    switch (planId) {
      case 'neural-starter':
        return 'free';
      case 'quantum-pro':
        return 'premium';
      case 'singularity':
        return 'enterprise';
      default:
        return 'free';
    }
  }

  /**
   * Determines institution type based on role
   */
  private static determineInstitutionType(roleId: string): UserOnboardingFlow['institutionType'] {
    switch (roleId) {
      case 'principal':
        return 'preschool'; // Currently focused on preschools
      case 'teacher':
        return 'preschool'; // Teachers typically belong to institutions
      case 'parent':
        return 'none'; // Parents can be individual or institutional
      default:
        return 'none';
    }
  }

  /**
   * Generates routing decision based on onboarding flow
   */
  private static generateRoutingDecision(flow: UserOnboardingFlow): RoutingDecision {
    // SCENARIO 1: Principal wants to create/register a school
    if (flow.userType === 'principal') {
      return {
        path: '/(auth)/school-onboarding',
        params: {
          plan: flow.subscriptionTier,
          role: flow.userType,
          flow_type: 'school_creation'
        },
        onboardingType: 'school_creation',
        requiredSteps: [
          'school_registration_request',
          'admin_approval_wait',
          'school_setup',
          'initial_configuration',
          'teacher_invitations'
        ]
      };
    }

    // SCENARIO 2: Teacher without invitation code (Independent/Private Tutor)
    if (flow.userType === 'teacher' && !flow.hasInvitationCode) {
      return {
        path: '/(auth)/sign-up',
        params: {
          plan: flow.subscriptionTier,
          role: flow.userType,
          flow_type: 'independent_educator',
          account_type: 'individual'
        },
        onboardingType: 'individual',
        requiredSteps: [
          'basic_account_creation',
          'educator_profile_setup',
          'subscription_selection',
          'payment_setup',
          'ai_tutor_configuration'
        ]
      };
    }

    // SCENARIO 3: Teacher with invitation code (Joining existing school)
    if (flow.userType === 'teacher' && flow.hasInvitationCode) {
      return {
        path: '/(auth)/join-with-code',
        params: {
          plan: flow.subscriptionTier,
          role: flow.userType,
          flow_type: 'institutional_join'
        },
        onboardingType: 'institutional',
        requiredSteps: [
          'code_validation',
          'account_creation',
          'teacher_profile_completion',
          'school_integration'
        ]
      };
    }

    // SCENARIO 4: Parent without invitation code (Individual/Family Plan)
    if (flow.userType === 'parent' && !flow.hasInvitationCode) {
      return {
        path: '/(auth)/sign-up',
        params: {
          plan: flow.subscriptionTier,
          role: flow.userType,
          flow_type: 'individual_family',
          account_type: 'individual'
        },
        onboardingType: 'individual',
        requiredSteps: [
          'basic_account_creation',
          'family_profile_setup',
          'children_registration',
          'subscription_selection',
          'ai_tutoring_setup',
          'learning_preferences'
        ]
      };
    }

    // SCENARIO 5: Parent with invitation code (Child attending preschool)
    if (flow.userType === 'parent' && flow.hasInvitationCode) {
      return {
        path: '/(auth)/join-with-code',
        params: {
          plan: 'institutional', // Override plan - school covers subscription
          role: flow.userType,
          flow_type: 'institutional_parent'
        },
        onboardingType: 'institutional',
        requiredSteps: [
          'code_validation',
          'parent_account_creation',
          'child_enrollment_confirmation',
          'communication_preferences'
        ]
      };
    }

    // DEFAULT: Basic account creation
    return {
      path: '/(auth)/sign-up',
      params: {
        plan: flow.subscriptionTier,
        role: flow.userType,
        flow_type: 'default'
      },
      onboardingType: 'individual',
      requiredSteps: ['basic_account_creation', 'profile_completion']
    };
  }

  /**
   * Executes the routing decision
   */
  static executeRouting(planId: string, roleId: string, hasInvitationCode = false): RoutingDecision {
    
    const decision = this.determineOnboardingFlow(planId, roleId, hasInvitationCode);
    
    // Build query string from params
    const queryParams = new URLSearchParams(decision.params).toString();
    const fullPath = `${decision.path}?${queryParams}`;
    
    // Navigate to the determined path
    try {
      router.push(fullPath as any);
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
    
    return decision;
  }

  /**
   * Determines if user needs invitation code based on context
   */
  static shouldPromptForInvitationCode(planId: string, roleId: string): boolean {
    // Free plan parents/teachers might have invitation codes
    if (planId === 'neural-starter' && (roleId === 'parent' || roleId === 'teacher')) {
      return true;
    }
    
    // Teachers joining premium plans might have school invitations
    if (roleId === 'teacher' && planId === 'quantum-pro') {
      return true;
    }
    
    return false;
  }

  /**
   * Get user-friendly flow description
   */
  static getFlowDescription(decision: RoutingDecision): string {
    const descriptions = {
      'school_creation': 'Create and register your educational institution',
      'independent_educator': 'Set up your private tutoring/teaching practice',
      'institutional_join': 'Join an existing educational institution',
      'individual_family': 'Set up family learning and AI tutoring',
      'institutional_parent': 'Connect with your child\'s school',
      'default': 'Create your educational account'
    };
    
    return descriptions[decision.params.flow_type as keyof typeof descriptions] || descriptions.default;
  }
}

/**
 * Advanced features configuration based on subscription tier
 */
export const AI_FEATURES_BY_TIER = {
  free: {
    aiLessonsPerWeek: 5, // Changed from per day to per week
    aiStudentsLimit: 3,  // Reduced limit
    roboticTutors: 1,
    neuralNetworks: ['basic'],
    holographicLessons: false,
    metaverseAccess: false, // Disabled for free
    quantumAnalytics: 'basic',
    brainInterface: false,
    timeTravelAnalytics: false,
    showAds: true, // Free tier shows ads
    trialPeriod: false
  },
  starter: {
    aiLessonsPerWeek: 25, // 5 per day
    aiStudentsLimit: 15,
    roboticTutors: 2,
    neuralNetworks: ['basic', 'advanced'],
    holographicLessons: true,
    metaverseAccess: true,
    quantumAnalytics: 'advanced',
    brainInterface: false,
    timeTravelAnalytics: false,
    showAds: false,
    trialPeriod: 14, // 14-day trial
    price: 49 // R49/month
  },
  premium: {
    aiLessonsPerWeek: -1, // Unlimited
    aiStudentsLimit: -1,  // Unlimited
    roboticTutors: 5,
    neuralNetworks: ['basic', 'advanced', 'deep_learning'],
    holographicLessons: 'coming_soon', // Placeholder for advanced features
    metaverseAccess: true,
    multiMetaverse: 'coming_soon',
    quantumAnalytics: 'predictive',
    brainInterface: 'coming_soon',
    timeTravelAnalytics: 'coming_soon',
    dimensionalTeaching: 'coming_soon',
    showAds: false,
    price: 149 // R149/month
  },
  enterprise: {
    aiLessonsPerWeek: -1, // Unlimited
    aiStudentsLimit: -1,  // Unlimited
    roboticTutors: -1,    // Unlimited
    neuralNetworks: ['basic', 'advanced', 'quantum_ai', 'consciousness'],
    holographicLessons: 'coming_soon',
    holographic4D: 'enterprise_only',
    metaverseAccess: true,
    omniverseAccess: 'enterprise_only',
    quantumAnalytics: 'enterprise_only',
    brainInterface: 'enterprise_only',
    timeTravelAnalytics: 'enterprise_only',
    godMode: 'enterprise_only',
    dimensionalTeaching: 'enterprise_only',
    realityTranscendence: 'enterprise_only',
    showAds: false,
    price: 299 // R299/month
  }
} as const;
