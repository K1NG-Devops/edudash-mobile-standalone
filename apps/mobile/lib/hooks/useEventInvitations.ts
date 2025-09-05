// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EventInvitation, UseEventInvitationsResult } from '@/types/groups';
import { useAuth } from '@/contexts/SimpleWorkingAuth';

export const useEventInvitations = (): UseEventInvitationsResult => {
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user?.id) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

const { data, error: fetchError } = await supabase
        .from<any, any>('event_invitations' as any)
        .select(`
          *,
          event:events(
            id,
            title,
            start_date,
            event_type,
            location,
            description,
            preschool_id
          ),
          inviter:users!event_invitations_inviter_id_fkey(
            id,
            name,
            avatar_url,
            role
          ),
          invitee:users!event_invitations_invitee_id_fkey(
            id,
            name,
            avatar_url,
            role
          )
        `)
        .or(`invitee_id.eq.${user.id},inviter_id.eq.${user.id}`)
        .order('invited_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvitations(data || []);
    } catch (err: any) {
      console.error('Error fetching event invitations:', err);
      setError(err.message || 'Failed to fetch event invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (eventId: string, userId: string) => {
    try {
      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from<any>('event_invitations' as any)
        .select('id')
        .eq('event_id', eventId)
        .eq('invitee_id', userId)
        .single();

      if (existingInvite) {
        throw new Error('User has already been invited to this event');
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from<any>('event_invitations' as any)
        .insert({
          event_id: eventId,
          inviter_id: user?.id,
          invitee_id: userId,
        } as any);

      if (inviteError) throw inviteError;

      // Get event info for activity logging
      const { data: eventData } = await supabase
        .from('events')
        .select('title, preschool_id')
        .eq('id', eventId)
        .single();

      // Log activity
await supabase
        .from<any, any>('activity_feed' as any)
        .insert({
          actor_id: user?.id,
          action: 'invited_user',
          target_type: 'event',
          target_id: eventId,
          preschool_id: (eventData as any)?.preschool_id,
          metadata: {
            invitee_id: userId,
            event_title: (eventData as any)?.title,
          },
        } as any);

      await fetchInvitations();
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      throw new Error(err.message || 'Failed to send invitation');
    }
  };

  const respondToInvitation = async (
    invitationId: string,
    status: 'accepted' | 'declined' | 'maybe',
    message?: string
  ) => {
    try {
      const { data: invitationData, error: fetchError } = await supabase
        .from<any>('event_invitations' as any)
        .select('event_id, event:events(preschool_id, title)')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from<any>('event_invitations' as any)
        .update({
          status,
          response_message: message,
          responded_at: new Date().toISOString(),
        } as any)
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // If accepted, create event participant record
      if (status === 'accepted') {
        await supabase
          .from('event_participants')
          .insert({
            event_id: (invitationData as any).event_id,
            user_id: user?.id,
            participation_type: 'attendee',
            status: 'registered',
          } as any);
      }

      // Log activity
      await supabase
        .from<any>('activity_feed' as any)
        .insert({
          actor_id: user?.id,
          action: status === 'accepted' ? 'accepted_invitation' : 'declined_invitation',
          target_type: 'event',
          target_id: (invitationData as any).event_id,
          preschool_id: (invitationData as any).event?.preschool_id,
          metadata: {
            event_title: (invitationData as any).event?.title,
            response: status,
          },
        } as any);

      await fetchInvitations();
    } catch (err: any) {
      console.error('Error responding to invitation:', err);
      throw new Error(err.message || 'Failed to respond to invitation');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from<any>('event_invitations' as any)
        .delete()
        .eq('id', invitationId)
        .eq('inviter_id', user?.id as any);

      if (deleteError) throw deleteError;

      await fetchInvitations();
    } catch (err: any) {
      console.error('Error canceling invitation:', err);
      throw new Error(err.message || 'Failed to cancel invitation');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    fetchInvitations();

    // Subscribe to invitation changes
    const invitationsSubscription = supabase
      .channel(`event-invitations:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_invitations',
          filter: `invitee_id=eq.${user.id}`,
        },
        () => {
          fetchInvitations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_invitations',
          filter: `inviter_id=eq.${user.id}`,
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invitationsSubscription);
    };
  }, [user?.id]);

  return {
    invitations,
    loading,
    error,
    sendInvitation,
    respondToInvitation,
    cancelInvitation,
    refresh: fetchInvitations,
  };
};
