import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  planName: string;
  features: string[];
  expiresAt?: string;
  isActive: boolean;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  enabled: boolean;
}

export interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  features: Feature[];
  hasFeatureAccess: (featureId: string) => boolean;
  isFeaturePremium: (featureId: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  userId?: string;
}

// Define available features with their tiers
const AVAILABLE_FEATURES: Omit<Feature, 'enabled'>[] = [
  {
    id: 'ai_lesson_generator',
    name: 'AI Lesson Generator',
    description: 'Generate lessons using AI',
    tier: 'premium',
  },
  {
    id: 'homework_grader',
    name: 'AI Homework Grader',
    description: 'Automatically grade homework assignments',
    tier: 'premium',
  },
  {
    id: 'stem_activities',
    name: 'STEM Activities',
    description: 'Access to premium STEM activity library',
    tier: 'premium',
  },
  {
    id: 'progress_analysis',
    name: 'Progress Analysis',
    description: 'Advanced analytics and progress tracking',
    tier: 'premium',
  },
  {
    id: 'class_management',
    name: 'Class Management',
    description: 'Basic class and student management',
    tier: 'free',
  },
  {
    id: 'basic_lessons',
    name: 'Basic Lessons',
    description: 'Access to basic lesson library',
    tier: 'free',
  },
  {
    id: 'student_enrollment',
    name: 'Student Enrollment',
    description: 'Enroll and manage students',
    tier: 'free',
  },
];

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ 
  children, 
  userId 
}) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For now, let's simulate subscription data since we don't have the database schema
  // In a real implementation, you would query the subscription from your database
  const loadSubscription = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual database query
      // const { data, error } = await supabase
      //   .from('subscriptions')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .single();
      
      // For demo purposes, randomly assign subscription tiers
      const isFreeTier = Math.random() > 0.3; // 70% chance of free tier
      
      const mockSubscription: SubscriptionData = isFreeTier 
        ? {
            tier: 'free',
            status: 'active',
            planName: 'Free Plan',
            features: ['class_management', 'basic_lessons', 'student_enrollment'],
            isActive: true,
          }
        : {
            tier: 'premium',
            status: 'active',
            planName: 'Premium Plan',
            features: ['ai_lesson_generator', 'homework_grader', 'stem_activities', 'progress_analysis', 'class_management', 'basic_lessons', 'student_enrollment'],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            isActive: true,
          };

      setSubscription(mockSubscription);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      
      // Fallback to free tier on error
      setSubscription({
        tier: 'free',
        status: 'active',
        planName: 'Free Plan',
        features: ['class_management', 'basic_lessons', 'student_enrollment'],
        isActive: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  // Generate features list with enabled status based on subscription
  const features: Feature[] = AVAILABLE_FEATURES.map(feature => ({
    ...feature,
    enabled: subscription?.features.includes(feature.id) || false,
  }));

  const hasFeatureAccess = (featureId: string): boolean => {
    if (!subscription || !subscription.isActive) {
      // If no subscription or inactive, only allow free features
      const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
      return feature?.tier === 'free' || false;
    }
    
    return subscription.features.includes(featureId);
  };

  const isFeaturePremium = (featureId: string): boolean => {
    const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
    return feature?.tier === 'premium' || feature?.tier === 'enterprise' || false;
  };

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const contextValue: SubscriptionContextType = {
    subscription,
    loading,
    error,
    features,
    hasFeatureAccess,
    isFeaturePremium,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Hook to check if user needs to upgrade for a feature
export const useFeatureAccess = (featureId: string) => {
  const { hasFeatureAccess, isFeaturePremium, subscription } = useSubscription();
  
  const hasAccess = hasFeatureAccess(featureId);
  const isPremium = isFeaturePremium(featureId);
  const needsUpgrade = !hasAccess && isPremium;
  
  return {
    hasAccess,
    isPremium,
    needsUpgrade,
    currentTier: subscription?.tier || 'free',
  };
};
