// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UseEventParticipationResult, 
  EventParticipationRequest,
  EventParticipant,
  EnhancedEvent 
} from '@/types/events';

export const useEventParticipation = (
  eventId: string | undefined,
  userId: string | undefined
): UseEventParticipationResult => {
  const [isParticipating, setIsParticipating] = useState(false);
  const [participation, setParticipation] = useState<EventParticipant | null>(null);

  const normalizeParticipant = (p: any): EventParticipant => ({
    ...p,
    student_id: p?.student_id ?? undefined,
  });
  const [loading, setLoading] = useState(false);

  // Check current participation status
  const checkParticipation = useCallback(async () => {
    if (!eventId || !userId) return;

    try {
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!userRecord) return;

      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:users(id, name, email, role, avatar_url),
          student:students(id, first_name, last_name, avatar_url, date_of_birth)
        `)
        .eq('event_id', eventId)
        .eq('user_id', userRecord.id)
        .single();

      if (!error && data) {
        setParticipation(normalizeParticipant(data));
        setIsParticipating(true);
      } else {
        setParticipation(null);
        setIsParticipating(false);
      }
    } catch (err) {
      console.error('Failed to check participation:', err);
    }
  }, [eventId, userId]);

  // Register for event
  const register = useCallback(async (request: EventParticipationRequest) => {
    if (!userId) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const { data: userRecord } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', userId)
        .single();

      if (!userRecord) throw new Error('User not found');

      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: request.event_id,
          user_id: userRecord.id,
          student_id: request.student_id,
          participation_type: request.participation_type || 'attendee',
          status: 'registered',
          notes: request.notes,
          metadata: {},
        })
        .select(`
          *,
          user:users(id, name, email, role, avatar_url),
          student:students(id, first_name, last_name, avatar_url, date_of_birth)
        `)
        .single();

      if (error) throw error;

      setParticipation(normalizeParticipant(data));
      setIsParticipating(true);

      // Create activity log entry
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('preschool_id')
          .eq('id', request.event_id)
          .single();

        if (eventData) {
          await supabase.from<any>('activity_feed' as any).insert({
            actor_id: userRecord.id,
            action: 'joined_event',
            target_type: 'event',
            target_id: request.event_id,
            preschool_id: (eventData as any).preschool_id,
            metadata: {
              participation_type: request.participation_type,
            },
            visibility: 'public',
          } as any);
        }
      } catch (activityError) {
        // Don't fail the main operation if activity logging fails
        console.warn('Failed to log activity:', activityError);
      }

    } catch (err: any) {
      console.error('Failed to register for event:', err);
      throw new Error(err.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Unregister from event
  const unregister = useCallback(async () => {
    if (!eventId || !userId || !participation) throw new Error('Cannot unregister');

    setLoading(true);
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participation.id);

      if (error) throw error;

      setParticipation(null);
      setIsParticipating(false);

      // Create activity log entry
      try {
        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', userId)
          .single();

        const { data: eventData } = await supabase
          .from('events')
          .select('preschool_id')
          .eq('id', eventId)
          .single();

        if (userRecord && eventData) {
          await supabase.from<any>('activity_feed' as any).insert({
            actor_id: userRecord.id,
            action: 'left_event',
            target_type: 'event',
            target_id: eventId,
            preschool_id: (eventData as any).preschool_id,
            metadata: {},
            visibility: 'public',
          } as any);
        }
      } catch (activityError) {
        console.warn('Failed to log activity:', activityError);
      }

    } catch (err: any) {
      console.error('Failed to unregister from event:', err);
      throw new Error(err.message || 'Failed to unregister from event');
    } finally {
      setLoading(false);
    }
  }, [eventId, userId, participation]);

  // Check in to event
  const checkIn = useCallback(async () => {
    if (!participation) throw new Error('Not registered for event');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .update({
          checked_in_at: new Date().toISOString(),
          status: 'attended',
        })
        .eq('id', participation.id)
        .select(`
          *,
          user:users(id, name, email, role, avatar_url),
          student:students(id, first_name, last_name, avatar_url, date_of_birth)
        `)
        .single();

      if (error) throw error;

      setParticipation(normalizeParticipant(data));

    } catch (err: any) {
      console.error('Failed to check in:', err);
      throw new Error(err.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  }, [participation]);

  // Check out from event
  const checkOut = useCallback(async () => {
    if (!participation) throw new Error('Not registered for event');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .update({
          checked_out_at: new Date().toISOString(),
        })
        .eq('id', participation.id)
        .select(`
          *,
          user:users(id, name, email, role, avatar_url),
          student:students(id, first_name, last_name, avatar_url, date_of_birth)
        `)
        .single();

      if (error) throw error;

      setParticipation(normalizeParticipant(data));

    } catch (err: any) {
      console.error('Failed to check out:', err);
      throw new Error(err.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  }, [participation]);

  return {
    isParticipating,
    participation,
    loading,
    register,
    unregister,
    checkIn,
    checkOut,
  };
};

// Helper function to handle event participation with proper UI feedback
export const handleEventJoin = async (
  event: EnhancedEvent,
  userId: string | undefined,
  options: {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
    studentId?: string;
    participationType?: EventParticipant['participation_type'];
  } = {}
) => {
  if (!userId) {
    options.onError?.('You must be logged in to join events');
    return;
  }

  try {
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userId)
      .single();

    if (!userRecord) {
      options.onError?.('User account not found');
      return;
    }

    // Check if already registered
    const { data: existingParticipation } = await supabase
      .from('event_participants')
      .select('id, status')
      .eq('event_id', event.id)
      .eq('user_id', userRecord.id)
      .single();

    if (existingParticipation) {
      if (existingParticipation.status === 'registered') {
        options.onError?.('You are already registered for this event');
      } else if (existingParticipation.status === 'attended') {
        options.onError?.('You have already attended this event');
      } else {
        options.onError?.('You are already signed up for this event');
      }
      return;
    }

    // Register for the event
    const { error } = await supabase
      .from('event_participants')
      .insert({
        event_id: event.id,
        user_id: userRecord.id,
        student_id: options.studentId,
        participation_type: options.participationType || 'attendee',
        status: 'registered',
        metadata: {},
      });

    if (error) throw error;

    // Log activity
    try {
      await supabase.from('activity_feed').insert({
        actor_id: userRecord.id,
        action: 'joined_event',
        target_type: 'event',
        target_id: event.id,
        preschool_id: event.preschool_id,
        metadata: {
          event_title: event.title,
          participation_type: options.participationType || 'attendee',
        },
        visibility: 'public',
      });
    } catch (activityError) {
      console.warn('Failed to log activity:', activityError);
    }

    options.onSuccess?.(`Successfully joined "${event.title}"`);

  } catch (err: any) {
    console.error('Failed to join event:', err);
    options.onError?.(err.message || 'Failed to join event');
  }
};

// Helper: cancel (unregister) from an event
export const handleEventCancel = async (
  event: EnhancedEvent,
  userId: string | undefined,
  options: {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
  } = {}
) => {
  if (!userId) {
    options.onError?.('You must be logged in to cancel');
    return;
  }
  try {
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userRecord) throw new Error('User account not found');

    const { data: participation } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', userRecord.id)
      .single();

    if (!participation) {
      options.onError?.('You are not registered for this event');
      return;
    }

    const { error: delErr } = await supabase
      .from('event_participants')
      .delete()
      .eq('id', participation.id);

    if (delErr) throw delErr;

    // Log activity (best-effort)
    try {
      await supabase.from('activity_feed').insert({
        actor_id: userRecord.id,
        action: 'left_event',
        target_type: 'event',
        target_id: event.id,
        preschool_id: event.preschool_id,
        metadata: { event_title: event.title },
        visibility: 'public',
      });
    } catch {}

    options.onSuccess?.(`Cancelled participation in "${event.title}"`);
  } catch (err: any) {
    console.error('Failed to cancel event participation:', err);
    options.onError?.(err.message || 'Failed to cancel');
  }
};
