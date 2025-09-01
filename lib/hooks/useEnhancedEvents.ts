import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  EnhancedEvent, 
  EventUpdate, 
  EventNotification,
  EventSearchOptions,
  UseEventUpdatesResult,
  UseEventNotificationsResult,
  CreateEventUpdateRequest,
  CreateEventReactionRequest
} from '@/types/events';

export const useEnhancedEvents = (
  preschoolId: string | undefined,
  options: EventSearchOptions = {},
  enabled: boolean = true
) => {
  const [events, setEvents] = useState<EnhancedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const offsetRef = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchEvents = useCallback(async (reset: boolean = false) => {
    if (!enabled || !preschoolId) return;

    try {
      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      }

      const currentOptions = optionsRef.current;
      const limit = currentOptions.limit || 20;
      const offset = reset ? 0 : offsetRef.current;

      // Build enhanced query with all related tables
      let query = supabase
        .from('events')
        .select(`
          *,
          event_updates(
            id, title, content, update_type, is_live, posted_at,
            author:users(id, name, avatar_url, role)
          ),
          event_media(
            id, media_type, file_url, thumbnail_url, alt_text, caption
          ),
          event_participants(
            id, user_id, student_id, participation_type, status
          )
        `)
        .eq('preschool_id', preschoolId)
        .order('start_date', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (currentOptions.filters) {
        const { status, event_type, tags, date_range, is_featured, has_updates } = currentOptions.filters;
        
        if (status && status.length > 0) {
          query = query.in('status', status);
        }
        if (event_type && event_type.length > 0) {
          query = query.in('event_type', event_type);
        }
        if (is_featured !== undefined) {
          query = query.eq('is_featured', is_featured);
        }
        if (tags && tags.length > 0) {
          query = query.overlaps('tags', tags);
        }
        if (date_range) {
          query = query.gte('start_date', date_range.start).lte('start_date', date_range.end);
        }
      }

      // Apply sorting
      if (currentOptions.sort) {
        const { field, direction } = currentOptions.sort;
        query = query.order(field, { ascending: direction === 'asc' });
      }

      // Apply search
      if (currentOptions.query) {
        query = query.or(`title.ilike.%${currentOptions.query}%,description.ilike.%${currentOptions.query}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Process the data to match EnhancedEvent interface
      const processedEvents: EnhancedEvent[] = (data || []).map((event: any) => ({
        ...event,
        preschool_id: event?.preschool_id ?? '',
        stats: {
          participants_count: event?.event_participants?.filter((p: any) => p.status === 'attended').length || 0,
          updates_count: event?.event_updates?.length || 0,
          media_count: event?.event_media?.length || 0,
          reactions_count: 0, // This would need a separate query
          comments_count: 0, // This would need a separate query
        },
        recent_updates: (event?.event_updates || []).slice(0, 3).map((u: any) => ({ ...u, title: u?.title ?? undefined })),
        featured_media: (event?.event_media || []).slice(0, 5),
      }));

      if (reset) {
        setEvents(processedEvents);
      } else {
        setEvents(prev => [...prev, ...processedEvents]);
      }

      setHasMore(processedEvents.length === limit);
      offsetRef.current += processedEvents.length;
      setError(null);

    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [preschoolId, enabled]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents(true);
  }, [fetchEvents]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchEvents(false);
  }, [fetchEvents, hasMore, loading]);

  // Initial fetch - only depends on stable values
  useEffect(() => {
    if (enabled && preschoolId) {
      fetchEvents(true);
    }
  }, [enabled, preschoolId]);

  // Real-time subscriptions - separate effect without fetchEvents dependency
  useEffect(() => {
    if (!enabled || !preschoolId) return;

    // Subscribe to event changes
    const eventsChannel = supabase
      .channel(`enhanced-events-${preschoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `preschool_id=eq.${preschoolId}`,
        },
        () => {
          // Trigger refresh by calling fetchEvents directly
          fetchEvents(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_updates',
        },
        () => {
          // Trigger refresh for new updates
          fetchEvents(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [enabled, preschoolId]);

  return {
    events,
    loading,
    error,
    hasMore,
    refreshing,
    refresh,
    loadMore,
  };
};

export const useEventUpdates = (
  eventId: string | undefined,
  enabled: boolean = true
): UseEventUpdatesResult => {
  const [updates, setUpdates] = useState<EventUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchUpdates = useCallback(async (reset: boolean = false) => {
    if (!enabled || !eventId) return;

    try {
      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      }

      const limit = 20;
      const offset = reset ? 0 : offsetRef.current;

      const { data, error: fetchError } = await supabase
        .from('event_updates')
        .select(`
          *,
          author:users(id, name, avatar_url, role),
          media:event_media(id, media_type, file_url, thumbnail_url, alt_text, caption)
        `)
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .order('posted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (fetchError) throw fetchError;

      const processedUpdates: EventUpdate[] = (data || []).map((u: any) => ({ ...u, title: u?.title ?? undefined }));

      if (reset) {
        setUpdates(processedUpdates);
      } else {
        setUpdates(prev => [...prev, ...processedUpdates]);
      }

      setHasMore(processedUpdates.length === limit);
      offsetRef.current += processedUpdates.length;
      setError(null);

    } catch (err: any) {
      console.error('Failed to fetch event updates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, enabled]);

  const refresh = useCallback(async () => {
    await fetchUpdates(true);
  }, [fetchUpdates]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchUpdates(false);
  }, [fetchUpdates, hasMore, loading]);

  const postUpdate = useCallback(async (updateData: CreateEventUpdateRequest): Promise<EventUpdate> => {
    if (!eventId) throw new Error('No event ID provided');

    // First, get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userRecord) throw new Error('User not found');

    const { data, error } = await supabase
      .from('event_updates')
      .insert({
        event_id: eventId,
        author_id: userRecord.id,
        title: updateData.title,
        content: updateData.content,
        update_type: updateData.update_type || 'general',
        is_live: updateData.is_live || false,
        visibility: updateData.visibility || 'public',
        metadata: updateData.metadata || {},
      })
      .select(`
        *,
        author:users(id, name, avatar_url, role)
      `)
      .single();

    if (error) throw error;

    const normalized = { ...(data as any), title: (data as any)?.title ?? undefined } as EventUpdate;

    // Add to the top of updates list
    setUpdates(prev => [normalized, ...prev]);

    return normalized;
  }, [eventId]);

  const reactToUpdate = useCallback(async (reaction: CreateEventReactionRequest): Promise<void> => {
    if (!reaction.update_id) throw new Error('No update ID provided');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userRecord) throw new Error('User not found');

    const { error } = await supabase
      .from('event_reactions')
      .upsert({
        update_id: reaction.update_id,
        user_id: userRecord.id,
        reaction_type: reaction.reaction_type,
        content: reaction.content,
        parent_reaction_id: reaction.parent_reaction_id,
      }, {
        onConflict: 'update_id,user_id,reaction_type',
      });

    if (error) throw error;
  }, []);

  // Real-time subscriptions for updates
  useEffect(() => {
    if (!enabled || !eventId) return;

    const channel = supabase
      .channel(`event-updates-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_updates',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('New event update:', payload);
          refresh(); // Refresh to get complete data with joins
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, eventId, refresh]);

  // Initial fetch
  useEffect(() => {
    if (enabled && eventId) {
      fetchUpdates(true);
    }
  }, [enabled, eventId, fetchUpdates]);

  return {
    updates,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    postUpdate,
    reactToUpdate,
  };
};

export const useEventNotifications = (
  userId: string | undefined,
  enabled: boolean = true
): UseEventNotificationsResult => {
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!userRecord) return;

      const { data, error } = await supabase
        .from('event_notifications')
        .select(`
          *,
          event:events(id, title, start_date)
        `)
        .eq('recipient_id', userRecord.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const normalized = (data || []).map((n: any) => ({ ...n, update_id: n?.update_id ?? undefined }));

      setNotifications(normalized);
      setUnreadCount(normalized.filter((n: any) => !n.read_at).length);

    } catch (err) {
      console.error('Failed to fetch event notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    const { error } = await supabase
      .from('event_notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', notificationIds);

    if (!error) {
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id)
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => prev - notificationIds.length);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};
