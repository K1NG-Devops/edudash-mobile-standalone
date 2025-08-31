// Overage Billing Service
// Handles usage tracking, overage calculation, and billing for users who exceed their plan limits

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

export interface UsageQuota {
  quotaType: string;
  currentUsage: number;
  quotaLimit: number;
  overageAmount: number;
  status: 'none' | 'approaching_limit' | 'at_limit' | 'exceeded';
  percentageUsed: number;
  unitPrice: number;
}

export interface OverageBillingRecord {
  id: string;
  userId: string;
  quotaType: string;
  overageUnits: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentReference?: string;
  paymentUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface OverageNotification {
  id: string;
  userId: string;
  quotaType: string;
  notificationType: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

class OverageBillingService {
  /**
   * Get current usage status for a user across all quota types
   */
  async getUserUsageStatus(userId?: string): Promise<{ data: UsageQuota[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_user_usage_status', {
        p_user_id: userId || undefined
      });

      if (error) {
        logger.error('Error fetching user usage status:', error);
        return { data: null, error: error.message };
      }

      const usageQuotas: UsageQuota[] = data?.map((item: any) => ({
        quotaType: item.quota_type,
        currentUsage: item.current_usage,
        quotaLimit: item.quota_limit,
        overageAmount: item.overage_amount,
        status: item.status,
        percentageUsed: parseFloat(item.percentage_used),
        unitPrice: parseFloat(item.unit_price)
      })) || [];

      return { data: usageQuotas, error: null };
    } catch (err) {
      logger.error('Error in getUserUsageStatus:', err);
      return { data: null, error: 'Failed to fetch usage status' };
    }
  }

  /**
   * Increment usage for a specific quota type
   */
  async incrementUsage(
    userId: string, 
    quotaType: string, 
    increment: number = 1
  ): Promise<{ data: UsageQuota | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_quota_type: quotaType,
        p_increment: increment
      });

      if (error) {
        logger.error('Error incrementing usage:', error);
        return { data: null, error: error.message };
      }

      if (!data.success) {
        return { data: null, error: 'Failed to increment usage' };
      }

      const usageQuota: UsageQuota = {
        quotaType,
        currentUsage: data.current_usage,
        quotaLimit: data.quota_limit,
        overageAmount: data.overage_amount,
        status: data.status,
        percentageUsed: data.percentage_used,
        unitPrice: 0 // Will be fetched separately if needed
      };

      return { data: usageQuota, error: null };
    } catch (err) {
      logger.error('Error in incrementUsage:', err);
      return { data: null, error: 'Failed to increment usage' };
    }
  }

  /**
   * Generate overage billing records for a user for a specific period
   */
  async generateOverageBilling(
    userId: string,
    periodStart?: string
  ): Promise<{ data: { totalAmount: number; currency: string; recordsCount: number; billingRecords: any[] } | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('generate_overage_billing', {
        p_user_id: userId,
        p_period_start: periodStart || undefined
      });

      if (error) {
        logger.error('Error generating overage billing:', error);
        return { data: null, error: error.message };
      }

      if (!data.success) {
        return { data: null, error: 'Failed to generate billing' };
      }

      return {
        data: {
          totalAmount: parseFloat(data.total_amount),
          currency: data.currency,
          recordsCount: data.records_count,
          billingRecords: data.billing_records
        },
        error: null
      };
    } catch (err) {
      logger.error('Error in generateOverageBilling:', err);
      return { data: null, error: 'Failed to generate overage billing' };
    }
  }

  /**
   * Get pending overage billing records for a user
   */
  async getPendingOverageBilling(userId: string): Promise<{ data: OverageBillingRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('overage_billing_records')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching pending billing records:', error);
        return { data: null, error: error.message };
      }

      const billingRecords: OverageBillingRecord[] = data?.map((record) => ({
        id: record.id,
        userId: record.user_id,
        quotaType: record.quota_type,
        overageUnits: record.overage_units,
        unitPrice: parseFloat(record.unit_price),
        totalAmount: parseFloat(record.total_amount),
        currency: record.currency,
        billingPeriodStart: record.billing_period_start,
        billingPeriodEnd: record.billing_period_end,
        status: record.status,
        paymentReference: record.payment_reference,
        paymentUrl: record.payment_url,
        paidAt: record.paid_at,
        createdAt: record.created_at
      })) || [];

      return { data: billingRecords, error: null };
    } catch (err) {
      logger.error('Error in getPendingOverageBilling:', err);
      return { data: null, error: 'Failed to fetch pending billing records' };
    }
  }

  /**
   * Update overage billing record with payment information
   */
  async updateOverageBillingPayment(
    billingId: string,
    paymentReference: string,
    paymentUrl?: string,
    status: 'processing' | 'completed' | 'failed' = 'processing'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const updateData: any = {
        payment_reference: paymentReference,
        status: status,
        updated_at: new Date().toISOString()
      };

      if (paymentUrl) {
        updateData.payment_url = paymentUrl;
      }

      if (status === 'completed') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('overage_billing_records')
        .update(updateData)
        .eq('id', billingId);

      if (error) {
        logger.error('Error updating billing payment:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      logger.error('Error in updateOverageBillingPayment:', err);
      return { success: false, error: 'Failed to update billing payment' };
    }
  }

  /**
   * Get overage notifications for a user
   */
  async getUserOverageNotifications(userId: string, unreadOnly: boolean = false): Promise<{ data: OverageNotification[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('overage_notifications')
        .select('*')
        .eq('user_id', userId);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query.order('sent_at', { ascending: false });

      if (error) {
        logger.error('Error fetching overage notifications:', error);
        return { data: null, error: error.message };
      }

      const notifications: OverageNotification[] = data?.map((notification) => ({
        id: notification.id,
        userId: notification.user_id,
        quotaType: notification.quota_type,
        notificationType: notification.notification_type,
        message: notification.message,
        isRead: notification.is_read,
        sentAt: notification.sent_at,
        readAt: notification.read_at
      })) || [];

      return { data: notifications, error: null };
    } catch (err) {
      logger.error('Error in getUserOverageNotifications:', err);
      return { data: null, error: 'Failed to fetch notifications' };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('overage_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        logger.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      logger.error('Error in markNotificationAsRead:', err);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Get plan quotas for a specific tier
   */
  async getPlanQuotas(planTier: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('plan_quotas')
        .select('*')
        .eq('plan_tier', planTier)
        .eq('overage_enabled', true);

      if (error) {
        logger.error('Error fetching plan quotas:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('Error in getPlanQuotas:', err);
      return { data: null, error: 'Failed to fetch plan quotas' };
    }
  }

  /**
   * Calculate estimated overage cost for a user
   */
  async calculateEstimatedOverageCost(userId: string): Promise<{ data: { totalCost: number; breakdown: any[] } | null; error: string | null }> {
    try {
      const usageResult = await this.getUserUsageStatus(userId);
      if (usageResult.error || !usageResult.data) {
        return { data: null, error: usageResult.error || 'Failed to get usage data' };
      }

      let totalCost = 0;
      const breakdown: any[] = [];

      for (const usage of usageResult.data) {
        if (usage.overageAmount > 0) {
          const cost = usage.overageAmount * usage.unitPrice;
          totalCost += cost;
          breakdown.push({
            quotaType: usage.quotaType,
            overageUnits: usage.overageAmount,
            unitPrice: usage.unitPrice,
            totalCost: cost
          });
        }
      }

      return {
        data: {
          totalCost,
          breakdown
        },
        error: null
      };
    } catch (err) {
      logger.error('Error in calculateEstimatedOverageCost:', err);
      return { data: null, error: 'Failed to calculate overage cost' };
    }
  }
}

export const overageBillingService = new OverageBillingService();
