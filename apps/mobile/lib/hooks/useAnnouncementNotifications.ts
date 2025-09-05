import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AnnouncementNotificationHook {
  unreadCount: number;
  announcements: any[];
  loading: boolean;
  refreshAnnouncements: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useAnnouncementNotifications = (
  userId: string | undefined,
  enabled: boolean = true
): AnnouncementNotificationHook => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  // Get internal user ID from auth_user_id
  const getInternalUserId = useCallback(async () => {
    if (!userId) return null;
    
    try {
      const { data: u } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      return u?.id || null;
    } catch (error) {
      console.error('Failed to get internal user ID:', error);
      return null;
    }
  }, [userId]);

  // Fetch announcements and count
  const fetchAnnouncements = useCallback(async () => {
    if (!enabled || !userId) return;

    setLoading(true);
    try {
      const internalId = await getInternalUserId();
      if (!internalId) {
        setLoading(false);
        return;
      }

      setInternalUserId(internalId);

      // Fetch announcements with read status
      const { data: msgs } = await (supabase as any)
        .from('message_recipients')
        .select(`
          id,
          read_at, 
          is_read, 
          message:messages(
            id, 
            content, 
            created_at, 
            sender_id, 
            message_type,
            deleted_at
          )
        `) 
        .eq('recipient_id', internalId)
        .eq('message.message_type', 'announcement')
        .is('message.deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter out null messages (RLS filtered)
      const validAnnouncements = (msgs || []).filter((r: any) => !!r.message);
      setAnnouncements(validAnnouncements);
      
      // Count unread announcements
      const unreadCount = validAnnouncements.filter((r: any) => !r.is_read && !r.read_at).length;
      setUnreadCount(unreadCount);

    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      setAnnouncements([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, getInternalUserId]);

  // Mark all announcements as read
  const markAllAsRead = useCallback(async () => {
    if (!internalUserId || unreadCount === 0) return;
    
    try {
      // Get unread announcement message IDs
      const unreadMessageIds = announcements
        .filter((r: any) => !r.is_read && !r.read_at)
        .map((r: any) => r.message.id);

      if (unreadMessageIds.length === 0) return;

      // Mark all unread announcements as read
      await (supabase as any)
        .from('message_recipients')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', internalUserId)
        .in('message_id', unreadMessageIds);
        
      // Update local state
      setUnreadCount(0);
      setAnnouncements(prev => 
        prev.map(r => ({ 
          ...r, 
          is_read: true, 
          read_at: r.read_at || new Date().toISOString() 
        }))
      );

    } catch (error) {
      console.error('Failed to mark announcements as read:', error);
    }
  }, [internalUserId, unreadCount, announcements]);

  // Refresh announcements manually
  const refreshAnnouncements = useCallback(async () => {
    await fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Initial load
  useEffect(() => {
    if (enabled && userId) {
      fetchAnnouncements();
    }
  }, [enabled, userId, fetchAnnouncements]);

  // Set up real-time subscription for new announcements
  useEffect(() => {
    if (!enabled || !userId || !internalUserId) return;

    // Subscribe to changes in message_recipients for this user
    const channel = supabase
      .channel('announcement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_recipients',
          filter: `recipient_id=eq.${internalUserId}`,
        },
        async (payload) => {
          // Check if this is an announcement
          const { data: message } = await (supabase as any)
            .from('messages')
            .select('message_type')
            .eq('id', payload.new.message_id)
            .single();

          if (message?.message_type === 'announcement') {
            // Refresh announcements to get the new one
            await fetchAnnouncements();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_recipients',
          filter: `recipient_id=eq.${internalUserId}`,
        },
        async (payload) => {
          // Handle read status updates
          if (payload.new.is_read !== payload.old.is_read) {
            await fetchAnnouncements();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, userId, internalUserId, fetchAnnouncements]);

  return {
    unreadCount,
    announcements: announcements.map(r => r.message),
    loading,
    refreshAnnouncements,
    markAllAsRead,
  };
};
