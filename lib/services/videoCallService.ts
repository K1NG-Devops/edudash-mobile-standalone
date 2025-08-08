import { supabase } from '@/lib/supabase';

export class VideoCallService {
  // Schedule a video call
  static async scheduleVideoCall(
    hostId: string,
    preschoolId: string,
    title: string,
    description: string | null,
    sessionType: 'parent_teacher' | 'parent_meeting' | 'staff_meeting' | 'group_call',
    invitedParticipants: string[],
    scheduledStartTime: string,
    scheduledEndTime: string,
    options?: {
      meetingRoomId?: string;
      meetingUrl?: string;
      dialInNumber?: string;
      accessCode?: string;
      maxParticipants?: number;
    }
  ) {
    try {
      const { data: videoCall, error } = await supabase
        .from('video_call_sessions')
        .insert({
          preschool_id: preschoolId,
          host_id: hostId,
          title,
          description,
          session_type: sessionType,
          invited_participants: invitedParticipants,
          scheduled_start_time: scheduledStartTime,
          scheduled_end_time: scheduledEndTime,
          meeting_room_id: options?.meetingRoomId || null,
          meeting_url: options?.meetingUrl || null,
          dial_in_number: options?.dialInNumber || null,
          access_code: options?.accessCode || null,
          max_participants: options?.maxParticipants || 10,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: videoCall, error: null };
    } catch (error) {
      console.error('Error scheduling video call:', error);
      return { data: null, error };
    }
  }

  // Get upcoming video calls for a user
  static async getUpcomingVideoCalls(userId: string) {
    try {
      const { data, error } = await supabase
        .from('video_call_sessions')
        .select(`
          *,
          host:users!video_call_sessions_host_id_fkey(name, avatar_url)
        `)
        .or(`host_id.eq.${userId},invited_participants.cs.{${userId}}`)
        .gt('scheduled_end_time', new Date().toISOString())
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting upcoming video calls:', error);
      return { data: null, error };
    }
  }

  // Cancel a video call
  static async cancelVideoCall(callId: string, userId: string) {
    try {
      const { data: call, error: fetchError } = await supabase
        .from('video_call_sessions')
        .select('*')
        .eq('id', callId)
        .single();

      if (fetchError) throw fetchError;

      if (call.host_id !== userId) {
        throw new Error('Only the host can cancel the call');
      }

      const { error } = await supabase
        .from('video_call_sessions')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Cancelled by host.',
        })
        .eq('id', callId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error cancelling video call:', error);
      return { error };
    }
  }

  // Join a video call
  static async joinVideoCall(callId: string, userId: string) {
    try {
      const { data: call, error: fetchError } = await supabase
        .from('video_call_sessions')
        .select('*')
        .eq('id', callId)
        .single();

      if (fetchError) throw fetchError;

      if (call.status !== 'scheduled' && call.status !== 'in_progress') {
        throw new Error('Cannot join a call that is not scheduled or in progress');
      }

      if (Array.isArray(call.joined_participants) && call.joined_participants.includes(userId)) {
        return { error: new Error('You have already joined this call') };
      }

      const { error } = await supabase
        .from('video_call_sessions')
        .update({
          joined_participants: [...(Array.isArray(call.joined_participants) ? call.joined_participants : []), userId],
        })
        .eq('id', callId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error joining video call:', error);
      return { error };
    }
  }
}

