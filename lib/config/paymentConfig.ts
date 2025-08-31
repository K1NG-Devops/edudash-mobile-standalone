/**
 * PayFast Payment Configuration
 * Handles both sandbox and production environments with proper security
 */

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  baseUrl: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingInterval: 'monthly' | 'annual';
  features: string[];
  limits: {
    children: number | null; // null = unlimited
    aiLessons: number | null;
    homeworkReviews: number | null;
    activities: number | null;
    tutoringSessions: number | null;
  };
  popular?: boolean;
  discount?: {
    percentage: number;
    originalPrice: number;
    label: string;
  };
}

// Environment Detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// PayFast Configuration
export const getPayFastConfig = (): PayFastConfig => {
  if (isProduction) {
    return {
      merchantId: process.env.PAYFAST_MERCHANT_ID!,
      merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
      passphrase: process.env.PAYFAST_PASSPHRASE!,
      baseUrl: 'https://www.payfast.co.za/eng/process',
      returnUrl: `${process.env.EXPO_PUBLIC_API_URL}/payment/success`,
      cancelUrl: `${process.env.EXPO_PUBLIC_API_URL}/payment/cancel`,
      notifyUrl: `${process.env.EXPO_PUBLIC_API_URL}/payment/notify`,
    };
  } else {
    // Sandbox configuration for development/testing
    return {
      merchantId: '10004241',
      merchantKey: 'q1cd2rdny4a53',
      passphrase: 'EduDashTestPassphrase2024',
      baseUrl: 'https://sandbox.payfast.co.za/eng/process',
      returnUrl: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081'}/payment/success`,
      cancelUrl: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081'}/payment/cancel`,
      notifyUrl: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081'}/payment/notify`,
    };
  }
};

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free-tier',
    name: 'EduStart',
    price: 0,
    billingInterval: 'monthly',
    features: [
      '1 child profile',
      '3 AI lesson generations/month',
      '2 homework AI reviews/month', 
      'Basic progress tracking',
      'Simple parent-teacher messaging',
      '5 activities per month'
    ],
    limits: {
      children: 1,
      aiLessons: 3,
      homeworkReviews: 2,
      activities: 5,
      tutoringSessions: 0,
    }
  },
  {
    id: 'neural-starter-monthly',
    name: 'Neural Starter',
    price: 49,
    billingInterval: 'monthly',
    features: [
      'Up to 3 children',
      '25 AI lesson generations/month',
      '15 homework AI reviews/month',
      'Advanced progress analytics',
      'Unlimited parent-teacher messaging',
      '50 activities per month',
      'Weekly AI progress reports',
      'Milestone tracking & predictions',
      'Priority support'
    ],
    limits: {
      children: 3,
      aiLessons: 25,
      homeworkReviews: 15,
      activities: 50,
      tutoringSessions: 0,
    },
    discount: {
      percentage: 50,
      originalPrice: 99,
      label: 'Launch Special'
    }
  },
  {
    id: 'neural-starter-annual',
    name: 'Neural Starter',
    price: 490,
    billingInterval: 'annual',
    features: [
      'Up to 3 children',
      '25 AI lesson generations/month',
      '15 homework AI reviews/month',
      'Advanced progress analytics',
      'Unlimited parent-teacher messaging',
      '50 activities per month',
      'Weekly AI progress reports',
      'Milestone tracking & predictions',
      'Priority support',
      'Save 17% vs monthly'
    ],
    limits: {
      children: 3,
      aiLessons: 25,
      homeworkReviews: 15,
      activities: 50,
      tutoringSessions: 0,
    },
    discount: {
      percentage: 58,
      originalPrice: 1188,
      label: 'Best Value'
    }
  },
  {
    id: 'quantum-pro-monthly',
    name: 'Quantum Pro',
    price: 149,
    billingInterval: 'monthly',
    popular: true,
    features: [
      'UNLIMITED children',
      'UNLIMITED AI lesson generations',
      'UNLIMITED homework AI reviews',
      'UNLIMITED activities',
      'Advanced AI tutoring (5 sessions/day)',
      'Personalized learning paths',
      'Real-time behavioral insights',
      'Advanced analytics dashboard',
      'Custom learning goals',
      'Integration with home learning',
      'Video progress reviews',
      'Priority support + phone calls',
      'Early access to new features'
    ],
    limits: {
      children: null,
      aiLessons: null,
      homeworkReviews: null,
      activities: null,
      tutoringSessions: 5,
    },
    discount: {
      percentage: 50,
      originalPrice: 299,
      label: 'Most Popular'
    }
  },
  {
    id: 'quantum-pro-annual',
    name: 'Quantum Pro',
    price: 1490,
    billingInterval: 'annual',
    popular: true,
    features: [
      'UNLIMITED children',
      'UNLIMITED AI lesson generations',
      'UNLIMITED homework AI reviews',
      'UNLIMITED activities',
      'Advanced AI tutoring (5 sessions/day)',
      'Personalized learning paths',
      'Real-time behavioral insights',
      'Advanced analytics dashboard',
      'Custom learning goals',
      'Integration with home learning',
      'Video progress reviews',
      'Priority support + phone calls',
      'Early access to new features',
      'Save 17% vs monthly'
    ],
    limits: {
      children: null,
      aiLessons: null,
      homeworkReviews: null,
      activities: null,
      tutoringSessions: 5,
    },
    discount: {
      percentage: 58,
      originalPrice: 3588,
      label: 'Best Value'
    }
  },
  {
    id: 'singularity-enterprise-monthly',
    name: 'Singularity Enterprise',
    price: 999,
    billingInterval: 'monthly',
    features: [
      'Everything in Quantum Pro',
      'UNLIMITED students & teachers',
      'School-wide analytics dashboard',
      'Curriculum management system',
      'Parent engagement tools',
      'Staff training & onboarding',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'White-label options',
      'Advanced reporting',
      'Integration with school systems'
    ],
    limits: {
      children: null,
      aiLessons: null,
      homeworkReviews: null,
      activities: null,
      tutoringSessions: null,
    }
  },
  {
    id: 'singularity-enterprise-annual',
    name: 'Singularity Enterprise',
    price: 9990,
    billingInterval: 'annual',
    features: [
      'Everything in Quantum Pro',
      'UNLIMITED students & teachers',
      'School-wide analytics dashboard',
      'Curriculum management system',
      'Parent engagement tools',
      'Staff training & onboarding',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'White-label options',
      'Advanced reporting',
      'Integration with school systems',
      'Save 17% vs monthly'
    ],
    limits: {
      children: null,
      aiLessons: null,
      homeworkReviews: null,
      activities: null,
      tutoringSessions: null,
    }
  }
];

// Trial Configuration
export const TRIAL_CONFIG = {
  durationDays: 14,
  enterpriseTrialDays: 30,
  fullAccess: true, // Full premium access during trial
  gracePeriodDays: 3, // Grace period after trial expires
  reminderDays: [10, 12, 13], // Days to send trial reminders
  convertIncentive: {
    discountPercentage: 20,
    durationMonths: 3,
    message: "Upgrade now and save 20% for your first 3 months!"
  }
};

// Feature limits for free tier enforcement
export const FREE_TIER_LIMITS = {
  AI_LESSONS_PER_MONTH: 3,
  HOMEWORK_REVIEWS_PER_MONTH: 2,
  ACTIVITIES_PER_MONTH: 5,
  CHILDREN_PROFILES: 1,
  TUTORING_SESSIONS_PER_MONTH: 0,
};

// Premium feature flags
export const PREMIUM_FEATURES = {
  UNLIMITED_AI_LESSONS: ['quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  UNLIMITED_HOMEWORK_REVIEWS: ['quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  UNLIMITED_ACTIVITIES: ['quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  AI_TUTORING: ['quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  ADVANCED_ANALYTICS: ['neural-starter-monthly', 'neural-starter-annual', 'quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  PERSONALIZED_LEARNING_PATHS: ['quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  VIDEO_PROGRESS_REPORTS: ['quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
  PRIORITY_SUPPORT: ['neural-starter-monthly', 'neural-starter-annual', 'quantum-pro-monthly', 'quantum-pro-annual', 'singularity-enterprise-monthly', 'singularity-enterprise-annual'],
};

// Payment success/failure messages
export const PAYMENT_MESSAGES = {
  SUCCESS: {
    title: 'Welcome to EduDash Premium! 🎉',
    message: 'Your subscription is now active. Let\'s unlock your child\'s potential!',
    action: 'Start Learning'
  },
  TRIAL_SUCCESS: {
    title: 'Your Free Trial Has Started! 🚀',
    message: 'You have 14 days of full premium access. Let\'s create your child\'s learning journey!',
    action: 'Begin Setup'
  },
  CANCEL: {
    title: 'Payment Cancelled',
    message: 'No worries! You can upgrade anytime from your dashboard.',
    action: 'Continue with Free'
  },
  ERROR: {
    title: 'Payment Error',
    message: 'Something went wrong with your payment. Please try again or contact support.',
    action: 'Try Again'
  }
};

// Utility functions
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getPlansByBillingInterval = (interval: 'monthly' | 'annual'): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.billingInterval === interval);
};

export const hasFeature = (planId: string, feature: keyof typeof PREMIUM_FEATURES): boolean => {
  return PREMIUM_FEATURES[feature].includes(planId);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const calculateTrialEndDate = (startDate: Date = new Date()): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.durationDays);
  return endDate;
};

export const getDaysUntilTrialEnd = (trialEndDate: Date): number => {
  const today = new Date();
  const timeDiff = trialEndDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysDiff);
};

export const shouldSendTrialReminder = (trialEndDate: Date): boolean => {
  const daysLeft = getDaysUntilTrialEnd(trialEndDate);
  return TRIAL_CONFIG.reminderDays.includes(TRIAL_CONFIG.durationDays - daysLeft + 1);
};
