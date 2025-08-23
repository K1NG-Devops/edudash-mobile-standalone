 
// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';
const log = createLogger('notifications');

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
  // Resolve app user id (users.id) from either users.id or auth user id
  private static async resolveUserId(userOrAuthId: string): Promise<string | null> {
    try {
      // First, try as users.id
      const { count: asUserIdCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('id', userOrAuthId);
      if ((asUserIdCount || 0) > 0) return userOrAuthId;

      // Fallback: treat input as auth_user_id and map to users.id
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userOrAuthId)
        .single();
      return userRow?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all notifications for a specific user (accepts users.id or auth_user_id)
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const resolved = await this.resolveUserId(userId);
      const targetId = resolved || userId;
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          type,
          is_read,
          created_at,
          user_id,
          action_url
        `)
        .eq('user_id', targetId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        log.error('❌ [NotificationService] Database error:', error);
        throw new Error(error.message);
      }

      // Normalize is_read -> read for UI
      const normalized = (data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: Boolean(n.is_read),
        created_at: n.created_at,
        user_id: n.user_id,
        action_url: n.action_url,
      }));

      return normalized;
    } catch (error) {
      try { log.error('❌ [NotificationService] Error fetching notifications:', error); } catch {}
      throw error;
    }
  }

  /**
   * Get unread notification count for a user (accepts users.id or auth_user_id)
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const resolved = await this.resolveUserId(userId);
      const targetId = resolved || userId;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetId)
        .eq('is_read', false);

      if (error) {
        log.error('❌ [NotificationService] Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      log.error('❌ [NotificationService] Error getting unread count:', error);
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
        log.error('❌ [NotificationService] Error marking as read:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      log.error('❌ [NotificationService] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user (accepts users.id or auth_user_id)
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const resolved = await this.resolveUserId(userId);
      const targetId = resolved || userId;
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetId)
        .eq('is_read', false);

      if (error) {
        log.error('❌ [NotificationService] Error marking all as read:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      log.error('❌ [NotificationService] Error marking all as read:', error);
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
    actionUrl?: string
  ): Promise<void> {
    try {
      const notification = {
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        action_url: actionUrl,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) {
        log.error('❌ [NotificationService] Error creating notification:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      log.error('❌ [NotificationService] Error creating notification:', error);
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
    actionUrl?: string
  ): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        action_url: actionUrl,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        log.error('❌ [NotificationService] Error creating bulk notifications:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      log.error('❌ [NotificationService] Error creating bulk notifications:', error);
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
        log.error('❌ [NotificationService] Error logging activity:', activityError);
        // Don't throw here, as notifications shouldn't fail because of activity logging
      } else {

      }

      // Create notifications based on activity type
      await this.handleActivityNotifications(userId, action, entityType, entityId, details);
    } catch (error) {
      log.error('❌ [NotificationService] Error in logActivity:', error);
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
            '/screens/super-admin-dashboard?tab=users'
          );
          break;

        case 'school_onboarding_requested':
          // Notify super admins about new school onboarding requests
          await this.notifySuperAdmins(
            '🏫 New School Onboarding Request',
            `${details?.school_name || 'A school'} has requested onboarding approval.`,
            'activity',
            '/screens/super-admin-dashboard?tab=onboarding'
          );
          break;

        case 'support_ticket_created':
          // Notify admins about support tickets
          await this.notifySuperAdmins(
            '🎫 New Support Ticket',
            `A new support ticket has been created: ${details?.subject || 'No subject'}`,
            'activity',
            '/screens/super-admin-dashboard?tab=system'
          );
          break;

        default:
          // General activity notification

          break;
      }
    } catch (error) {
      log.error('❌ [NotificationService] Error handling activity notifications:', error);
    }
  }

  /**
   * Notify all super admins
   */
  private static async notifySuperAdmins(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'activity' = 'info',
    actionUrl?: string
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
        actionUrl
      );

    } catch (error) {
      log.error('❌ [NotificationService] Error notifying super admins:', error);
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
        log.error('❌ [NotificationService] Error cleaning up old notifications:', error);
        throw new Error(error.message);
      }

    } catch (error) {
      log.error('❌ [NotificationService] Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Call secure Edge Function to create a notification (server/admin contexts only)
   * IMPORTANT: Requires a server-provided token. Do NOT bundle tokens in public clients.
   */
  static async sendServerNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'activity';
    actionUrl?: string;
    token?: string; // MUST be provided at call time from a secure store
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId, title, message, type = 'info', actionUrl, token } = params || {} as any;
      if (!token) {
        return { success: false, error: 'Missing server token. Do not call from public clients.' };
      }
      if (!userId || !title || !message) {
        return { success: false, error: 'Missing required fields' };
      }
      const { data, error } = await (supabase as any).functions.invoke('notify-user', {
        body: {
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl || null,
        },
        headers: { 'X-Edudash-Token': token },
      });
      if (error) {
        return { success: false, error: error.message || 'Invoke failed' };
      }
      if (data && data.error) {
        return { success: false, error: data.error };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to call notify-user' };
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
        log.error('❌ [NotificationService] Error fetching activity logs:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      log.error('❌ [NotificationService] Error fetching activity logs:', error);
      throw error;
    }
  }
}
