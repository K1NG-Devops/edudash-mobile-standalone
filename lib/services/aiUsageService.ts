import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type AIUsageLog = Database['public']['Tables']['ai_usage_logs']['Row'];
type AIUsageInsert = Database['public']['Tables']['ai_usage_logs']['Insert'];

export interface AIUsageStats {
    currentMonthUsage: number;
    totalUsage: number;
    lastUsedAt: string | null;
}

export class AIUsageService {
    /**
     * Track AI usage for a specific user and feature
     */
    static async trackUsage(
        userId: string,
        feature: string,
        tokensUsed?: number,
        costUsd?: number
    ): Promise<boolean> {
        try {
            // Get the user's database ID from their auth ID
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', userId)
                .single();

            if (userError || !userData) {
                console.error('Error finding user for AI tracking:', userError);
                return false;
            }

            const usageLog: AIUsageInsert = {
                user_id: userData.id,
                feature,
                tokens_used: tokensUsed || null,
                cost_usd: costUsd || null,
                created_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('ai_usage_logs')
                .insert(usageLog);

            if (error) {
                console.error('Error logging AI usage:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error tracking AI usage:', error);
            return false;
        }
    }

    /**
     * Get AI usage statistics for a user
     */
    static async getUsageStats(userId: string): Promise<AIUsageStats | null> {
        try {
            // Get the user's database ID from their auth ID
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', userId)
                .single();

            if (userError || !userData) {
                console.error('Error finding user for usage stats:', userError);
                return null;
            }

            // Get current month usage
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const startOfMonth = `${currentMonth}-01T00:00:00.000Z`;
            const endOfMonth = new Date(
                new Date(startOfMonth).getFullYear(),
                new Date(startOfMonth).getMonth() + 1,
                0,
                23,
                59,
                59,
                999
            ).toISOString();

            const { data: currentMonthLogs, error: currentMonthError } = await supabase
                .from('ai_usage_logs')
                .select('id, created_at')
                .eq('user_id', userData.id)
                .gte('created_at', startOfMonth)
                .lte('created_at', endOfMonth);

            if (currentMonthError) {
                console.error('Error fetching current month usage:', currentMonthError);
                return null;
            }

            // Get total usage
            const { data: totalLogs, error: totalError } = await supabase
                .from('ai_usage_logs')
                .select('id, created_at')
                .eq('user_id', userData.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (totalError) {
                console.error('Error fetching total usage:', totalError);
                return null;
            }

            // Get all usage count
            const { count: totalCount, error: countError } = await supabase
                .from('ai_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userData.id);

            if (countError) {
                console.error('Error fetching usage count:', countError);
                return null;
            }

            return {
                currentMonthUsage: currentMonthLogs?.length || 0,
                totalUsage: totalCount || 0,
                lastUsedAt: totalLogs?.[0]?.created_at || null,
            };
        } catch (error) {
            console.error('Error getting usage stats:', error);
            return null;
        }
    }

    /**
     * Check if user can use AI feature based on their subscription tier
     */
    static async canUseAIFeature(userId: string): Promise<{
        canUse: boolean;
        reason?: string;
        currentUsage: number;
        limit: number;
    }> {
        try {
            // Get user's subscription tier
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, subscription_tier')
                .eq('auth_user_id', userId)
                .single();

            if (userError || !userData) {
                return {
                    canUse: false,
                    reason: 'User not found',
                    currentUsage: 0,
                    limit: 0,
                };
            }

            // Define limits by tier
            const limits = {
                free: 5,
                premium: 100,
                enterprise: -1, // unlimited
            };

            const userTier = (userData.subscription_tier as keyof typeof limits) || 'free';
            const limit = limits[userTier];

            // If unlimited, allow usage
            if (limit === -1) {
                const stats = await this.getUsageStats(userId);
                return {
                    canUse: true,
                    currentUsage: stats?.currentMonthUsage || 0,
                    limit: -1,
                };
            }

            // Check current month usage
            const stats = await this.getUsageStats(userId);
            const currentUsage = stats?.currentMonthUsage || 0;

            return {
                canUse: currentUsage < limit,
                reason: currentUsage >= limit ? 'Monthly limit reached' : undefined,
                currentUsage,
                limit,
            };
        } catch (error) {
            console.error('Error checking AI feature access:', error);
            return {
                canUse: false,
                reason: 'Error checking access',
                currentUsage: 0,
                limit: 0,
            };
        }
    }

    /**
     * Get AI usage logs for a user (for analytics/debugging)
     */
    static async getUsageLogs(
        userId: string,
        limit: number = 50,
        feature?: string
    ): Promise<AIUsageLog[]> {
        try {
            // Get the user's database ID from their auth ID
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', userId)
                .single();

            if (userError || !userData) {
                console.error('Error finding user for usage logs:', userError);
                return [];
            }

            let query = supabase
                .from('ai_usage_logs')
                .select('*')
                .eq('user_id', userData.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (feature) {
                query = query.eq('feature', feature);
            }

            const { data: logs, error } = await query;

            if (error) {
                console.error('Error fetching usage logs:', error);
                return [];
            }

            return logs || [];
        } catch (error) {
            console.error('Error getting usage logs:', error);
            return [];
        }
    }

    /**
     * Get usage summary by feature for a user
     */
    static async getUsageSummaryByFeature(userId: string): Promise<Record<string, number>> {
        try {
            // Get the user's database ID from their auth ID
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', userId)
                .single();

            if (userError || !userData) {
                console.error('Error finding user for usage summary:', userError);
                return {};
            }

            // Get current month usage by feature
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const startOfMonth = `${currentMonth}-01T00:00:00.000Z`;
            const endOfMonth = new Date(
                new Date(startOfMonth).getFullYear(),
                new Date(startOfMonth).getMonth() + 1,
                0,
                23,
                59,
                59,
                999
            ).toISOString();

            const { data: logs, error } = await supabase
                .from('ai_usage_logs')
                .select('feature')
                .eq('user_id', userData.id)
                .gte('created_at', startOfMonth)
                .lte('created_at', endOfMonth);

            if (error) {
                console.error('Error fetching usage summary:', error);
                return {};
            }

            // Count by feature
            const summary: Record<string, number> = {};
            logs?.forEach(log => {
                summary[log.feature] = (summary[log.feature] || 0) + 1;
            });

            return summary;
        } catch (error) {
            console.error('Error getting usage summary:', error);
            return {};
        }
    }
}

// Export convenience functions
export const trackAIUsage = AIUsageService.trackUsage;
export const getAIUsageStats = AIUsageService.getUsageStats;
export const canUseAIFeature = AIUsageService.canUseAIFeature;

