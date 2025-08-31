import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { supabase } from '@/lib/supabase';

export interface QuotaLimits {
  aiGenerations: number;
  studentsPerClass: number;
  lessonsPerWeek: number;
  storageGB: number;
  monthlyLessons: number;
  advancedFeatures: boolean;
}

export interface UsageStats {
  aiGenerationsUsed: number;
  studentsCount: number;
  lessonsCreated: number;
  storageUsed: number;
  monthlyLessonsUsed: number;
}

export interface OverageStatus {
  isAtLimit: boolean;
  isOverLimit: boolean;
  percentageUsed: number;
  remainingQuota: number;
  nextResetDate: Date;
  suggestedUpgrade?: string;
  warningThreshold: number; // 80% by default
}

const PLAN_QUOTAS: Record<string, QuotaLimits> = {
  free: {
    aiGenerations: 5,
    studentsPerClass: 3,
    lessonsPerWeek: 2,
    storageGB: 0.5,
    monthlyLessons: 5,
    advancedFeatures: false,
  },
  starter: {
    aiGenerations: 25,
    studentsPerClass: 15,
    lessonsPerWeek: 10,
    storageGB: 2,
    monthlyLessons: 25,
    advancedFeatures: false,
  },
  premium: {
    aiGenerations: -1, // unlimited
    studentsPerClass: 50,
    lessonsPerWeek: -1, // unlimited
    storageGB: 10,
    monthlyLessons: -1, // unlimited
    advancedFeatures: true,
  },
  enterprise: {
    aiGenerations: -1, // unlimited
    studentsPerClass: -1, // unlimited
    lessonsPerWeek: -1, // unlimited
    storageGB: 100,
    monthlyLessons: -1, // unlimited
    advancedFeatures: true,
  },
};

export function useOverageTracking(quotaType: keyof QuotaLimits) {
  const { profile } = useAuth();
  const { subscription } = useSubscription();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current plan limits
  const planTier = subscription?.plan_tier || 'free';
  const quotaLimits = PLAN_QUOTAS[planTier] || PLAN_QUOTAS.free;

  // Calculate overage status for specific quota type
  const getOverageStatus = (type: keyof QuotaLimits): OverageStatus => {
    if (!usage) {
      return {
        isAtLimit: false,
        isOverLimit: false,
        percentageUsed: 0,
        remainingQuota: 0,
        nextResetDate: new Date(),
        warningThreshold: 80,
      };
    }

    const limit = quotaLimits[type];
    let used = 0;

    switch (type) {
      case 'aiGenerations':
        used = usage.aiGenerationsUsed;
        break;
      case 'studentsPerClass':
        used = usage.studentsCount;
        break;
      case 'monthlyLessons':
        used = usage.monthlyLessonsUsed;
        break;
      case 'storageGB':
        used = usage.storageUsed;
        break;
      default:
        used = 0;
    }

    // Handle unlimited quotas
    if (limit === -1) {
      return {
        isAtLimit: false,
        isOverLimit: false,
        percentageUsed: 0,
        remainingQuota: -1, // unlimited
        nextResetDate: getNextResetDate(),
        warningThreshold: 80,
      };
    }

    const percentageUsed = (used / limit) * 100;
    const isAtLimit = used >= limit;
    const isOverLimit = used > limit;
    const remainingQuota = Math.max(0, limit - used);

    // Suggest upgrade based on usage patterns
    let suggestedUpgrade: string | undefined;
    if (percentageUsed >= 80) {
      if (planTier === 'free') {
        suggestedUpgrade = 'starter';
      } else if (planTier === 'starter') {
        suggestedUpgrade = 'premium';
      } else if (planTier === 'premium') {
        suggestedUpgrade = 'enterprise';
      }
    }

    return {
      isAtLimit,
      isOverLimit,
      percentageUsed: Math.min(100, percentageUsed),
      remainingQuota,
      nextResetDate: getNextResetDate(),
      suggestedUpgrade,
      warningThreshold: 80,
    };
  };

  // Calculate next quota reset date (monthly)
  const getNextResetDate = (): Date => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  };

  // Fetch usage statistics from database
  const fetchUsageStats = async () => {
    if (!profile?.auth_user_id) return;

    try {
      setLoading(true);
      setError(null);

      // Get current month range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Fetch AI generations count for current month
      const { count: aiGenerationsCount } = await supabase
        .from('ai_generation_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.auth_user_id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.auth_user_id);

      // Fetch lessons created this month
      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.auth_user_id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      // Fetch storage usage (simplified - you might want to implement actual file size tracking)
      const { count: mediaCount } = await supabase
        .from('lesson_media')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by', profile.auth_user_id);

      // Estimate storage usage (rough calculation)
      const estimatedStorageGB = (mediaCount || 0) * 0.05; // Assume 50MB per media file on average

      setUsage({
        aiGenerationsUsed: aiGenerationsCount || 0,
        studentsCount: studentsCount || 0,
        lessonsCreated: lessonsCount || 0,
        storageUsed: estimatedStorageGB,
        monthlyLessonsUsed: lessonsCount || 0,
      });
    } catch (err: any) {
      console.error('Error fetching usage stats:', err);
      setError(err.message || 'Failed to fetch usage statistics');
    } finally {
      setLoading(false);
    }
  };

  // Increment usage counter (for real-time updates)
  const incrementUsage = (type: keyof UsageStats, amount = 1) => {
    setUsage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [type]: prev[type] + amount,
      };
    });
  };

  // Check if a specific action is allowed
  const canPerformAction = (type: keyof QuotaLimits): boolean => {
    const status = getOverageStatus(type);
    return !status.isAtLimit;
  };

  // Get usage warning message
  const getUsageWarning = (type: keyof QuotaLimits): string | null => {
    const status = getOverageStatus(type);
    
    if (status.isOverLimit) {
      return `You've exceeded your ${type} limit. Upgrade to continue using this feature.`;
    }
    
    if (status.percentageUsed >= status.warningThreshold) {
      return `You're using ${status.percentageUsed.toFixed(0)}% of your ${type} quota. Consider upgrading to avoid interruptions.`;
    }

    return null;
  };

  useEffect(() => {
    fetchUsageStats();
    
    // Refresh usage stats every 5 minutes
    const interval = setInterval(fetchUsageStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile?.auth_user_id, planTier]);

  return {
    usage,
    quotaLimits,
    loading,
    error,
    getOverageStatus: () => getOverageStatus(quotaType),
    canPerformAction,
    getUsageWarning,
    incrementUsage,
    refreshUsage: fetchUsageStats,
    planTier,
  };
}

// Hook for multiple quota types
export function useOverageTrackingMultiple(
  quotaTypes: (keyof QuotaLimits)[],
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const { profile } = useAuth();
  const { subscription } = useSubscription();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const planTier = subscription?.plan_tier || 'free';
  const quotaLimits = PLAN_QUOTAS[planTier] || PLAN_QUOTAS.free;

  const getOverageStatuses = () => {
    const statuses: Record<string, OverageStatus> = {};
    
    quotaTypes.forEach(type => {
      if (!usage) {
        statuses[type] = {
          isAtLimit: false,
          isOverLimit: false,
          percentageUsed: 0,
          remainingQuota: 0,
          nextResetDate: new Date(),
          warningThreshold: 80,
        };
        return;
      }

      const limit = quotaLimits[type];
      let used = 0;

      switch (type) {
        case 'aiGenerations':
          used = usage.aiGenerationsUsed;
          break;
        case 'studentsPerClass':
          used = usage.studentsCount;
          break;
        case 'monthlyLessons':
          used = usage.monthlyLessonsUsed;
          break;
        case 'storageGB':
          used = usage.storageUsed;
          break;
      }

      if (limit === -1) {
        statuses[type] = {
          isAtLimit: false,
          isOverLimit: false,
          percentageUsed: 0,
          remainingQuota: -1,
          nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          warningThreshold: 80,
        };
      } else {
        const percentageUsed = (used / limit) * 100;
        const isAtLimit = used >= limit;
        const isOverLimit = used > limit;
        const remainingQuota = Math.max(0, limit - used);

        let suggestedUpgrade: string | undefined;
        if (percentageUsed >= 80) {
          if (planTier === 'free') {
            suggestedUpgrade = 'starter';
          } else if (planTier === 'starter') {
            suggestedUpgrade = 'premium';
          } else if (planTier === 'premium') {
            suggestedUpgrade = 'enterprise';
          }
        }

        statuses[type] = {
          isAtLimit,
          isOverLimit,
          percentageUsed: Math.min(100, percentageUsed),
          remainingQuota,
          nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          suggestedUpgrade,
          warningThreshold: 80,
        };
      }
    });

    return statuses;
  };

  // Fetch usage statistics
  const fetchUsageStats = async () => {
    if (!enabled) {
      // When disabled, ensure loading is false and skip fetching
      setLoading(false);
      return;
    }

    if (!profile?.auth_user_id) return;

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const { count: aiGenerationsCount } = await supabase
        .from('ai_generation_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.auth_user_id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.auth_user_id);

      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.auth_user_id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      const { count: mediaCount } = await supabase
        .from('lesson_media')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by', profile.auth_user_id);

      const estimatedStorageGB = (mediaCount || 0) * 0.05;

      setUsage({
        aiGenerationsUsed: aiGenerationsCount || 0,
        studentsCount: studentsCount || 0,
        lessonsCreated: lessonsCount || 0,
        storageUsed: estimatedStorageGB,
        monthlyLessonsUsed: lessonsCount || 0,
      });
    } catch (err: any) {
      console.error('Error fetching usage stats:', err);
      setError(err.message || 'Failed to fetch usage statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return; // do not set up any intervals when disabled
    }

    fetchUsageStats();
    
    const interval = setInterval(fetchUsageStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [enabled, profile?.auth_user_id, planTier]);

  return {
    usage,
    quotaLimits,
    loading,
    error,
    getOverageStatuses,
    refreshUsage: fetchUsageStats,
    planTier,
  };
}
