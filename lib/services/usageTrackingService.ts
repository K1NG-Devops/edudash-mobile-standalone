import { supabase } from '../supabase';
import { SubscriptionService, PlatformSubscription } from './subscriptionService';
import { createLogger } from '@/lib/utils/logger';
import type { Database } from '../../types/database';

const log = createLogger('usage-tracking');

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface UsageQuotas {
  ai_lessons_per_day: number | null; // null = unlimited
  homework_grading_per_day: number | null;
  ai_tutoring_sessions_per_day: number | null;
  premium_content_access: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  custom_themes: boolean;
  offline_content_download: boolean;
  multi_child_support: boolean;
  parent_portal_access: boolean;
}

export interface CurrentUsage {
  ai_lessons_used_today: number;
  ai_lessons_used_this_month: number;
  homework_graded_today: number;
  homework_graded_this_month: number;
  ai_tutoring_sessions_today: number;
  premium_features_accessed_today: number;
  last_reset_date: string;
}

export interface UsageStats extends CurrentUsage {
  quotas: UsageQuotas;
  subscription_tier: string;
  can_use_ai_lessons: boolean;
  can_use_homework_grading: boolean;
  can_use_ai_tutoring: boolean;
  can_access_premium_features: boolean;
  days_until_reset: number;
  upgrade_recommended: boolean;
  usage_warnings: UsageWarning[];
}

export interface UsageWarning {
  type: 'approaching_limit' | 'limit_reached' | 'feature_restricted';
  feature: string;
  message: string;
  action_required: boolean;
  upgrade_tier?: string;
}

export interface UsageLogEntry {
  id?: string;
  user_id: string;
  feature_type: 'ai_lesson' | 'homework_grading' | 'ai_tutoring' | 'premium_feature';
  feature_name: string;
  usage_count: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

// =====================================================
// USAGE TRACKING SERVICE
// =====================================================

export class UsageTrackingService {
  
  // =====================================================
  // QUOTA DEFINITIONS BY SUBSCRIPTION TIER
  // =====================================================
  
  private static readonly TIER_QUOTAS: Record<string, UsageQuotas> = {
    free: {
      ai_lessons_per_day: 3,
      homework_grading_per_day: 5,
      ai_tutoring_sessions_per_day: 1,
      premium_content_access: false,
      advanced_analytics: false,
      priority_support: false,
      custom_themes: false,
      offline_content_download: false,
      multi_child_support: false,
      parent_portal_access: true
    },
    starter: {
      ai_lessons_per_day: 15,
      homework_grading_per_day: 25,
      ai_tutoring_sessions_per_day: 5,
      premium_content_access: true,
      advanced_analytics: false,
      priority_support: false,
      custom_themes: true,
      offline_content_download: true,
      multi_child_support: true,
      parent_portal_access: true
    },
    premium: {
      ai_lessons_per_day: 50,
      homework_grading_per_day: 100,
      ai_tutoring_sessions_per_day: 20,
      premium_content_access: true,
      advanced_analytics: true,
      priority_support: true,
      custom_themes: true,
      offline_content_download: true,
      multi_child_support: true,
      parent_portal_access: true
    },
    enterprise: {
      ai_lessons_per_day: null, // unlimited
      homework_grading_per_day: null,
      ai_tutoring_sessions_per_day: null,
      premium_content_access: true,
      advanced_analytics: true,
      priority_support: true,
      custom_themes: true,
      offline_content_download: true,
      multi_child_support: true,
      parent_portal_access: true
    }
  };

  // =====================================================
  // USAGE TRACKING METHODS
  // =====================================================

  /**
   * Record usage of a feature for a user
   */
  static async recordUsage(
    userId: string, 
    featureType: UsageLogEntry['feature_type'],
    featureName: string,
    count: number = 1,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const entry: UsageLogEntry = {
        user_id: userId,
        feature_type: featureType,
        feature_name: featureName,
        usage_count: count,
        metadata: metadata,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('usage_logs')
        .insert(entry);

      if (error) {
        log.error('Failed to record usage:', error);
        return false;
      }

      log.info(`Usage recorded: ${featureType} - ${featureName} (${count}x) for user ${userId}`);
      return true;
    } catch (error) {
      log.error('Error recording usage:', error);
      return false;
    }
  }

  /**
   * Get current usage stats for a user
   */
  static async getUserUsageStats(userId: string): Promise<UsageStats | null> {
    try {
      // Get user's current subscription
      const subscription = await SubscriptionService.getUserSubscription(userId);
      const tier = subscription?.plan?.tier || 'free';
      const quotas = this.TIER_QUOTAS[tier];

      if (!quotas) {
        log.error(`Unknown subscription tier: ${tier}`);
        return null;
      }

      // Get today's usage
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: todayUsage } = await supabase
        .from('usage_logs')
        .select('feature_type, usage_count')
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString());

      const { data: monthUsage } = await supabase
        .from('usage_logs')
        .select('feature_type, usage_count')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString());

      // Calculate usage totals
      const aiLessonsToday = this.sumUsageByType(todayUsage || [], 'ai_lesson');
      const aiLessonsMonth = this.sumUsageByType(monthUsage || [], 'ai_lesson');
      const homeworkToday = this.sumUsageByType(todayUsage || [], 'homework_grading');
      const homeworkMonth = this.sumUsageByType(monthUsage || [], 'homework_grading');
      const tutoringToday = this.sumUsageByType(todayUsage || [], 'ai_tutoring');
      const premiumToday = this.sumUsageByType(todayUsage || [], 'premium_feature');

      // Calculate permissions
      const canUseAiLessons = quotas.ai_lessons_per_day === null || aiLessonsToday < quotas.ai_lessons_per_day;
      const canUseHomeworkGrading = quotas.homework_grading_per_day === null || homeworkToday < quotas.homework_grading_per_day;
      const canUseAiTutoring = quotas.ai_tutoring_sessions_per_day === null || tutoringToday < quotas.ai_tutoring_sessions_per_day;
      
      // Generate usage warnings
      const warnings = this.generateUsageWarnings(
        { aiLessonsToday, homeworkToday, tutoringToday },
        quotas,
        tier
      );

      const usageStats: UsageStats = {
        ai_lessons_used_today: aiLessonsToday,
        ai_lessons_used_this_month: aiLessonsMonth,
        homework_graded_today: homeworkToday,
        homework_graded_this_month: homeworkMonth,
        ai_tutoring_sessions_today: tutoringToday,
        premium_features_accessed_today: premiumToday,
        last_reset_date: todayStart.toISOString(),
        quotas,
        subscription_tier: tier,
        can_use_ai_lessons: canUseAiLessons,
        can_use_homework_grading: canUseHomeworkGrading,
        can_use_ai_tutoring: canUseAiTutoring,
        can_access_premium_features: quotas.premium_content_access,
        days_until_reset: this.getDaysUntilReset(),
        upgrade_recommended: this.shouldRecommendUpgrade(warnings, tier),
        usage_warnings: warnings
      };

      return usageStats;
    } catch (error) {
      log.error('Error fetching user usage stats:', error);
      return null;
    }
  }

  /**
   * Check if user can perform a specific action
   */
  static async canPerformAction(
    userId: string, 
    action: 'ai_lesson' | 'homework_grading' | 'ai_tutoring' | 'premium_feature'
  ): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
    try {
      const stats = await this.getUserUsageStats(userId);
      if (!stats) {
        return { allowed: false, reason: 'Unable to check usage limits' };
      }

      switch (action) {
        case 'ai_lesson':
          if (!stats.can_use_ai_lessons) {
            return {
              allowed: false,
              reason: `Daily AI lesson limit reached (${stats.quotas.ai_lessons_per_day})`,
              upgradeRequired: stats.subscription_tier === 'free'
            };
          }
          break;

        case 'homework_grading':
          if (!stats.can_use_homework_grading) {
            return {
              allowed: false,
              reason: `Daily homework grading limit reached (${stats.quotas.homework_grading_per_day})`,
              upgradeRequired: stats.subscription_tier === 'free'
            };
          }
          break;

        case 'ai_tutoring':
          if (!stats.can_use_ai_tutoring) {
            return {
              allowed: false,
              reason: `Daily AI tutoring limit reached (${stats.quotas.ai_tutoring_sessions_per_day})`,
              upgradeRequired: stats.subscription_tier === 'free'
            };
          }
          break;

        case 'premium_feature':
          if (!stats.can_access_premium_features) {
            return {
              allowed: false,
              reason: 'Premium features require subscription upgrade',
              upgradeRequired: true
            };
          }
          break;

        default:
          return { allowed: false, reason: 'Unknown action type' };
      }

      return { allowed: true };
    } catch (error) {
      log.error('Error checking action permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Get usage analytics for admin dashboard
   */
  static async getUsageAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalUsage: number;
    usageByFeature: Record<string, number>;
    usageByTier: Record<string, number>;
    topUsers: Array<{ user_id: string; total_usage: number; tier: string }>;
  } | null> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select(`
          user_id,
          feature_type,
          feature_name,
          usage_count,
          user:users(
            subscription:platform_subscriptions(
              plan:subscription_plans(tier)
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!usageLogs) return null;

      const totalUsage = usageLogs.reduce((sum, log) => sum + log.usage_count, 0);

      // Usage by feature
      const usageByFeature = usageLogs.reduce((acc, log) => {
        const feature = `${log.feature_type}: ${log.feature_name}`;
        acc[feature] = (acc[feature] || 0) + log.usage_count;
        return acc;
      }, {} as Record<string, number>);

      // Usage by tier
      const usageByTier = usageLogs.reduce((acc, log) => {
        const tier = log.user?.subscription?.plan?.tier || 'free';
        acc[tier] = (acc[tier] || 0) + log.usage_count;
        return acc;
      }, {} as Record<string, number>);

      // Top users
      const userUsage = usageLogs.reduce((acc, log) => {
        const userId = log.user_id;
        const tier = log.user?.subscription?.plan?.tier || 'free';
        
        if (!acc[userId]) {
          acc[userId] = { user_id: userId, total_usage: 0, tier };
        }
        acc[userId].total_usage += log.usage_count;
        return acc;
      }, {} as Record<string, { user_id: string; total_usage: number; tier: string }>);

      const topUsers = Object.values(userUsage)
        .sort((a, b) => b.total_usage - a.total_usage)
        .slice(0, 10);

      return {
        totalUsage,
        usageByFeature,
        usageByTier,
        topUsers
      };
    } catch (error) {
      log.error('Error fetching usage analytics:', error);
      return null;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private static sumUsageByType(
    usageLogs: Array<{ feature_type: string; usage_count: number }>,
    featureType: string
  ): number {
    return usageLogs
      .filter(log => log.feature_type === featureType)
      .reduce((sum, log) => sum + log.usage_count, 0);
  }

  private static generateUsageWarnings(
    currentUsage: { aiLessonsToday: number; homeworkToday: number; tutoringToday: number },
    quotas: UsageQuotas,
    tier: string
  ): UsageWarning[] {
    const warnings: UsageWarning[] = [];

    // AI Lessons warnings
    if (quotas.ai_lessons_per_day !== null) {
      const usage = currentUsage.aiLessonsToday;
      const limit = quotas.ai_lessons_per_day;
      const percentage = (usage / limit) * 100;

      if (usage >= limit) {
        warnings.push({
          type: 'limit_reached',
          feature: 'AI Lessons',
          message: `You've reached your daily limit of ${limit} AI lessons.`,
          action_required: true,
          upgrade_tier: tier === 'free' ? 'starter' : 'premium'
        });
      } else if (percentage >= 80) {
        warnings.push({
          type: 'approaching_limit',
          feature: 'AI Lessons',
          message: `You've used ${usage} of ${limit} AI lessons today.`,
          action_required: false
        });
      }
    }

    // Homework grading warnings
    if (quotas.homework_grading_per_day !== null) {
      const usage = currentUsage.homeworkToday;
      const limit = quotas.homework_grading_per_day;
      const percentage = (usage / limit) * 100;

      if (usage >= limit) {
        warnings.push({
          type: 'limit_reached',
          feature: 'Homework Grading',
          message: `You've reached your daily limit of ${limit} homework gradings.`,
          action_required: true,
          upgrade_tier: tier === 'free' ? 'starter' : 'premium'
        });
      } else if (percentage >= 80) {
        warnings.push({
          type: 'approaching_limit',
          feature: 'Homework Grading',
          message: `You've used ${usage} of ${limit} homework gradings today.`,
          action_required: false
        });
      }
    }

    // Premium feature warnings
    if (!quotas.premium_content_access && tier === 'free') {
      warnings.push({
        type: 'feature_restricted',
        feature: 'Premium Content',
        message: 'Upgrade to access premium learning content and advanced features.',
        action_required: false,
        upgrade_tier: 'starter'
      });
    }

    return warnings;
  }

  private static getDaysUntilReset(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const now = new Date();
    const msUntilReset = tomorrow.getTime() - now.getTime();
    return Math.ceil(msUntilReset / (1000 * 60 * 60 * 24));
  }

  private static shouldRecommendUpgrade(warnings: UsageWarning[], currentTier: string): boolean {
    const hasLimitWarnings = warnings.some(w => 
      w.type === 'limit_reached' || w.type === 'approaching_limit'
    );
    
    const hasFeatureRestrictions = warnings.some(w => 
      w.type === 'feature_restricted'
    );

    return (hasLimitWarnings || hasFeatureRestrictions) && currentTier !== 'enterprise';
  }

  /**
   * Reset daily usage counters (typically called by a scheduled job)
   */
  static async resetDailyUsage(): Promise<boolean> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      // Archive old usage data (move to usage_logs_archive table)
      const { error: archiveError } = await supabase
        .from('usage_logs_archive')
        .insert([
          // This would typically be done with a SQL function or cron job
        ]);

      // Clear old usage logs (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error: cleanupError } = await supabase
        .from('usage_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      log.info('Daily usage reset completed');
      return !archiveError && !cleanupError;
    } catch (error) {
      log.error('Error resetting daily usage:', error);
      return false;
    }
  }

  /**
   * Get quota information for a specific tier
   */
  static getTierQuotas(tier: string): UsageQuotas {
    return this.TIER_QUOTAS[tier] || this.TIER_QUOTAS['free'];
  }

  /**
   * Compare features between tiers (for upgrade recommendations)
   */
  static compareTiers(currentTier: string, targetTier: string): {
    improvements: string[];
    new_features: string[];
    quota_increases: Record<string, { current: number | null; new: number | null }>;
  } {
    const currentQuotas = this.TIER_QUOTAS[currentTier] || this.TIER_QUOTAS['free'];
    const targetQuotas = this.TIER_QUOTAS[targetTier];

    const improvements: string[] = [];
    const new_features: string[] = [];
    const quota_increases: Record<string, { current: number | null; new: number | null }> = {};

    // Check quota increases
    if (targetQuotas.ai_lessons_per_day !== currentQuotas.ai_lessons_per_day) {
      quota_increases['AI Lessons'] = {
        current: currentQuotas.ai_lessons_per_day,
        new: targetQuotas.ai_lessons_per_day
      };
      improvements.push(`${targetQuotas.ai_lessons_per_day === null ? 'Unlimited' : targetQuotas.ai_lessons_per_day} AI lessons per day`);
    }

    if (targetQuotas.homework_grading_per_day !== currentQuotas.homework_grading_per_day) {
      quota_increases['Homework Grading'] = {
        current: currentQuotas.homework_grading_per_day,
        new: targetQuotas.homework_grading_per_day
      };
      improvements.push(`${targetQuotas.homework_grading_per_day === null ? 'Unlimited' : targetQuotas.homework_grading_per_day} homework gradings per day`);
    }

    // Check new features
    const featureMap = {
      premium_content_access: 'Premium Content Access',
      advanced_analytics: 'Advanced Analytics',
      priority_support: 'Priority Customer Support',
      custom_themes: 'Custom Themes',
      offline_content_download: 'Offline Content Download',
      multi_child_support: 'Multiple Children Support'
    };

    Object.entries(featureMap).forEach(([key, description]) => {
      if (targetQuotas[key as keyof UsageQuotas] && !currentQuotas[key as keyof UsageQuotas]) {
        new_features.push(description);
      }
    });

    return { improvements, new_features, quota_increases };
  }
}
