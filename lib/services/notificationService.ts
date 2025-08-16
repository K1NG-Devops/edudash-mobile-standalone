/* eslint-disable */
// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'activity';
  read: boolean;
  created_at: string;
  user_id: string;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

export class NotificationService {
  /**
   * Get all notifications for a specific user
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ [NotificationService] Database error:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('❌ [NotificationService] Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ [NotificationService] Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ [NotificationService] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [NotificationService] Error marking as read:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('❌ [NotificationService] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ [NotificationService] Error marking all as read:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('❌ [NotificationService] Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'activity' = 'info',
    actionUrl?: string,
    relatedEntityType?: string,
    relatedEntityId?: string
  ): Promise<void> {
    try {
      const notification = {
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        action_url: actionUrl,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) {
        console.error('❌ [NotificationService] Error creating notification:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('❌ [NotificationService] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'activity' = 'info',
    actionUrl?: string,
    relatedEntityType?: string,
    relatedEntityId?: string
  ): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        action_url: actionUrl,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('❌ [NotificationService] Error creating bulk notifications:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('❌ [NotificationService] Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Log user activity and potentially create notifications
   */
  static async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    try {
      // Log the activity
      const activityLog = {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details ? JSON.stringify(details) : null,
        created_at: new Date().toISOString()
      };

      const { error: activityError } = await supabase
        .from('activity_logs')
        .insert([activityLog]);

      if (activityError) {
        console.error('❌ [NotificationService] Error logging activity:', activityError);
        // Don't throw here, as notifications shouldn't fail because of activity logging
      } else {

      }

      // Create notifications based on activity type
      await this.handleActivityNotifications(userId, action, entityType, entityId, details);
    } catch (error) {
      console.error('❌ [NotificationService] Error in logActivity:', error);
      // Don't throw to prevent breaking the main flow
    }
  }

  /**
   * Handle automatic notification creation based on activities
   */
  private static async handleActivityNotifications(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    try {
      switch (action) {
        case 'school_onboarding_approved':
          await this.createNotification(
            userId,
            '🎉 School Onboarding Approved!',
            'Your school onboarding request has been approved. You can now access all platform features.',
            'success',
            '/screens/super-admin-dashboard?tab=schools',
            'preschool',
            entityId
          );
          break;

        case 'school_onboarding_rejected':
          await this.createNotification(
            userId,
            '❌ School Onboarding Rejected',
            'Your school onboarding request has been rejected. Please contact support for more information.',
            'error',
            '/screens/super-admin-dashboard?tab=onboarding',
            'preschool',
            entityId
          );
          break;

        case 'user_status_changed':
          const statusMessage = details?.new_status === 'active' 
            ? 'Your account has been activated!' 
            : details?.new_status === 'suspended' 
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account status has been updated.';
          
          await this.createNotification(
            userId,
            'Account Status Updated',
            statusMessage,
            details?.new_status === 'active' ? 'success' : 'warning',
            '/screens/profile'
          );
          break;

        case 'new_user_registered':
          // Notify super admins about new user registrations
          await this.notifySuperAdmins(
            '👤 New User Registration',
            `A new ${details?.role || 'user'} has registered: ${details?.name || 'Unknown'}`,
            'activity',
            '/screens/super-admin-dashboard?tab=users',
            'user',
            entityId
          );
          break;

        case 'school_onboarding_requested':
          // Notify super admins about new school onboarding requests
          await this.notifySuperAdmins(
            '🏫 New School Onboarding Request',
            `${details?.school_name || 'A school'} has requested onboarding approval.`,
            'activity',
            '/screens/super-admin-dashboard?tab=onboarding',
            'preschool',
            entityId
          );
          break;

        case 'support_ticket_created':
          // Notify admins about support tickets
          await this.notifySuperAdmins(
            '🎫 New Support Ticket',
            `A new support ticket has been created: ${details?.subject || 'No subject'}`,
            'activity',
            '/screens/super-admin-dashboard?tab=system',
            'support_ticket',
            entityId
          );
          break;

        default:
          // General activity notification

          break;
      }
    } catch (error) {
      console.error('❌ [NotificationService] Error handling activity notifications:', error);
    }
  }

  /**
   * Notify all super admins
   */
  private static async notifySuperAdmins(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'activity' = 'info',
    actionUrl?: string,
    relatedEntityType?: string,
    relatedEntityId?: string
  ): Promise<void> {
    try {
      // Get all super admin user IDs
      const { data: superAdmins, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'superadmin')
        .eq('is_active', true);

      if (error || !superAdmins || superAdmins.length === 0) {

        return;
      }

      const userIds = superAdmins.map(admin => admin.id);
      await this.createBulkNotifications(
        userIds,
        title,
        message,
        type,
        actionUrl,
        relatedEntityType,
        relatedEntityId
      );

    } catch (error) {
      console.error('❌ [NotificationService] Error notifying super admins:', error);
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('❌ [NotificationService] Error cleaning up old notifications:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('❌ [NotificationService] Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Get recent activity logs for a user
   */
  static async getUserActivityLogs(userId: string, limit: number = 20): Promise<ActivityLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [NotificationService] Error fetching activity logs:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('❌ [NotificationService] Error fetching activity logs:', error);
      throw error;
    }
  }
}
