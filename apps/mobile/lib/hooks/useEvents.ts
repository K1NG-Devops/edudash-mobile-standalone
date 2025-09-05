import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location?: string;
  preschool_id: string;
  created_by: string;
  requires_approval?: boolean;
  max_participants?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  participants?: {
    user_id: string;
    status: string;
  }[];
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location?: string;
  requires_approval?: boolean;
  max_participants?: number;
  audience_type?: string;
  invited_users?: string[];
}

export interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (eventData: CreateEventData) => Promise<Event>;
  joinEvent: (eventId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useEvents = (preschoolId: string): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!preschoolId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          event_participants(
            user_id,
            status
          )
        `)
        .eq('preschool_id', preschoolId)
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const normalized = (data || []).map((d: any) => ({
        ...d,
        description: d?.description ?? undefined,
        participants: d?.event_participants?.map((p: any) => ({ user_id: p.user_id, status: p.status })) ?? [],
      }));
      setEvents(normalized as Event[]);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [preschoolId]);

  const createEvent = useCallback(async (eventData: CreateEventData): Promise<Event> => {
    if (!preschoolId) {
      throw new Error('No preschool ID provided');
    }

    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get the user's internal ID
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userRecord) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.event_type,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location,
        preschool_id: preschoolId,
        created_by: userRecord.id,
        requires_approval: eventData.requires_approval || false,
        max_participants: eventData.max_participants,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Refresh events list
    await fetchEvents();

    return { ...(data as any), description: (data as any)?.description ?? undefined } as Event;
  }, [preschoolId, fetchEvents]);

  const joinEvent = useCallback(async (eventId: string): Promise<void> => {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get the user's internal ID
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userRecord) {
      throw new Error('User not found');
    }

    const { error } = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: userRecord.id,
        status: 'registered',
        participation_type: 'attendee',
      });

    if (error) {
      throw error;
    }

    // Refresh events list
    await fetchEvents();
  }, [fetchEvents]);

  const refresh = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time subscriptions
  useEffect(() => {
    if (!preschoolId) return;

    const eventsChannel = supabase
      .channel(`events-${preschoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `preschool_id=eq.${preschoolId}`,
        },
        () => {
          fetchEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [preschoolId, fetchEvents]);

  return {
    events,
    loading,
    error,
    createEvent,
    joinEvent,
    refresh,
  };
};
