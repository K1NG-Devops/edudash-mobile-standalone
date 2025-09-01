import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';

export interface SubscriptionData {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    planName: string;
    features: string[];
    expiresAt?: string;
    isActive: boolean;
    aiUsageLimit: number;
    aiUsageUsed: number;
    userRole?: string; // To track if user is superadmin
}

export interface Feature {
    id: string;
    name: string;
    description: string;
    tier: SubscriptionTier;
    enabled: boolean;
}

export interface AIUsageInfo {
    currentUsage: number;
    monthlyLimit: number;
    remainingUsage: number;
    resetDate: string;
    canUseAI: boolean;
}

export interface SubscriptionContextType {
    subscription: SubscriptionData | null;
    loading: boolean;
    error: string | null;
    features: Feature[];
    aiUsage: AIUsageInfo | null;
    hasFeatureAccess: (featureId: string) => boolean;
    isFeaturePremium: (featureId: string) => boolean;
    canUseAIFeature: (featureId: string) => boolean;
    trackAIUsage: (featureId: string) => Promise<boolean>;
    refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
    userId?: string;
}

// Define available features with their tiers and AI usage requirements
const AVAILABLE_FEATURES: Omit<Feature, 'enabled'>[] = [
    {
        id: 'ai_lesson_generator',
        name: 'AI Lesson Generator',
        description: 'Generate lessons using AI',
        tier: 'free', // Allow free tier but with limits
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

// AI features that count towards usage limits
const AI_FEATURES = ['ai_lesson_generator', 'homework_grader'];

// Monthly AI usage limits by tier
const AI_USAGE_LIMITS = {
    free: 5,
    premium: 100,
    enterprise: -1, // unlimited
};

type AIUsageLog = Database['public']['Tables']['ai_usage_logs']['Row'];
type AIUsageInsert = Database['public']['Tables']['ai_usage_logs']['Insert'];

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
    children,
    userId
}) => {
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aiUsage, setAIUsage] = useState<AIUsageInfo | null>(null);

    const loadSubscription = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get user's subscription tier and role from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, subscription_tier, subscription_status, role')
                .eq('auth_user_id', userId)
                .maybeSingle();

            if (userError && userError.code !== 'PGRST116') {
                // If columns don't exist yet, continue with default values
                if (userError.code === '42703') {
                    console.warn('Subscription columns not found in database. Using default values.');
                } else {
                    throw userError;
                }
            }

            // Default to free tier if no user found
            const tier = (userData?.subscription_tier as SubscriptionTier) || 'free';
            const status = (userData?.subscription_status as SubscriptionStatus) || 'active';
            const userRole = userData?.role || 'parent';

            // SuperAdmins get unlimited access regardless of tier
            const isSuperAdmin = userRole === 'superadmin';

            // Load AI usage for current month
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            const startOfMonth = `${currentMonth}-01T00:00:00.000Z`;
            const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

            // IMPORTANT: ai_usage_logs.user_id references users.id (profile UUID), not auth_user_id
            const { data: usageLogs, error: usageError } = await supabase
                .from('ai_usage_logs')
                .select('*')
                .eq('user_id', userData?.id || '')
                .gte('created_at', startOfMonth)
                .lte('created_at', endOfMonth);

            if (usageError) {
                console.warn('Error loading AI usage:', usageError);
            }

            // Calculate current usage
            const currentUsage = usageLogs?.length || 0;
            const monthlyLimit = isSuperAdmin ? -1 : AI_USAGE_LIMITS[tier]; // SuperAdmins get unlimited
            const remainingUsage = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - currentUsage);

            // Calculate next reset date (first day of next month)
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            nextMonth.setHours(0, 0, 0, 0);

            const subscriptionData: SubscriptionData = {
                tier,
                status,
                planName: isSuperAdmin ? 'SuperAdmin (Unlimited)' : tier === 'free' ? 'Free Plan' : tier === 'premium' ? 'Premium Plan' : 'Enterprise Plan',
                features: isSuperAdmin ? getAllFeatures() : getFeaturesByTier(tier),
                isActive: status === 'active',
                aiUsageLimit: monthlyLimit,
                aiUsageUsed: currentUsage,
                userRole: userRole,
            };

            const aiUsageInfo: AIUsageInfo = {
                currentUsage,
                monthlyLimit,
                remainingUsage,
                resetDate: nextMonth.toISOString(),
                canUseAI: monthlyLimit === -1 || currentUsage < monthlyLimit,
            };

            setSubscription(subscriptionData);
            setAIUsage(aiUsageInfo);
        } catch (err) {
            console.error('Error loading subscription:', err);
            setError(err instanceof Error ? err.message : 'Failed to load subscription');

            // Fallback to free tier on error
            const fallbackSubscription: SubscriptionData = {
                tier: 'free',
                status: 'active',
                planName: 'Free Plan',
                features: getFeaturesByTier('free'),
                isActive: true,
                aiUsageLimit: AI_USAGE_LIMITS.free,
                aiUsageUsed: 0,
            };

            const fallbackAIUsage: AIUsageInfo = {
                currentUsage: 0,
                monthlyLimit: AI_USAGE_LIMITS.free,
                remainingUsage: AI_USAGE_LIMITS.free,
                resetDate: new Date().toISOString(),
                canUseAI: true,
            };

            setSubscription(fallbackSubscription);
            setAIUsage(fallbackAIUsage);
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
        // SuperAdmins have unlimited access to all features
        if (subscription?.userRole === 'superadmin') {
            return true;
        }

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

    const canUseAIFeature = (featureId: string): boolean => {
        // SuperAdmins have unlimited AI access
        if (subscription?.userRole === 'superadmin') {
            return true;
        }

        // Check if feature requires AI
        if (!AI_FEATURES.includes(featureId)) {
            return hasFeatureAccess(featureId);
        }

        // Check subscription access
        if (!hasFeatureAccess(featureId)) {
            return false;
        }

        // If usage not loaded yet, assume allowed to avoid false upgrade prompts
        if (!aiUsage) {
            return true;
        }

        return aiUsage.canUseAI;
    };

    const trackAIUsage = async (featureId: string): Promise<boolean> => {
        // Client-side tracking no longer writes to ai_usage_logs to avoid double-counting.
        // Server-side ai-proxy is the single source of truth and logs usage upon successful AI responses.
        // We still gate based on current subscription state.
        if (!userId || !subscription || !aiUsage) return true;
        if (subscription.userRole === 'superadmin') return true;
        if (!AI_FEATURES.includes(featureId)) return true;
        if (!aiUsage.canUseAI) return false;
        return true;
    };

    useEffect(() => {
        loadSubscription();
    }, [userId]);

    const contextValue: SubscriptionContextType = {
        subscription,
        loading,
        error,
        features,
        aiUsage,
        hasFeatureAccess,
        isFeaturePremium,
        canUseAIFeature,
        trackAIUsage,
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
    const { hasFeatureAccess, isFeaturePremium, canUseAIFeature, subscription, aiUsage } = useSubscription();

    const hasAccess = hasFeatureAccess(featureId);
    const isPremium = isFeaturePremium(featureId);
    const needsUpgrade = !hasAccess && isPremium;
    const canUseAI = canUseAIFeature(featureId);
    const isAIFeature = AI_FEATURES.includes(featureId);

    return {
        hasAccess,
        isPremium,
        needsUpgrade,
        canUseAI,
        isAIFeature,
        currentTier: subscription?.tier || 'free',
        aiUsage: aiUsage,
    };
};

// Helper function to get features by tier
function getFeaturesByTier(tier: SubscriptionTier): string[] {
    switch (tier) {
        case 'free':
            return ['class_management', 'basic_lessons', 'student_enrollment', 'ai_lesson_generator'];
        case 'premium':
            return ['ai_lesson_generator', 'homework_grader', 'stem_activities', 'progress_analysis', 'class_management', 'basic_lessons', 'student_enrollment'];
        case 'enterprise':
            return ['ai_lesson_generator', 'homework_grader', 'stem_activities', 'progress_analysis', 'class_management', 'basic_lessons', 'student_enrollment'];
        default:
            return ['class_management', 'basic_lessons', 'student_enrollment'];
    }
}

// Get all features for SuperAdmins
function getAllFeatures(): string[] {
    return AVAILABLE_FEATURES.map(feature => feature.id);
}

export default SubscriptionProvider;
